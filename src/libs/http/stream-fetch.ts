import { inflateSync } from "node:zlib"

export type StreamFetchInit = {
  readonly stream: ReadableWritablePair<Uint8Array, Uint8Array>
  readonly signal?: AbortSignal
  readonly headers?: HeadersInit
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const CRLF = encoder.encode("\r\n")
const CRLFCRLF = encoder.encode("\r\n\r\n")

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return out
}

function indexOf(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

function maybeInflateZlib(buf: Uint8Array): Uint8Array {
  if (buf.length >= 2 && buf[0] === 0x78) {
    try {
      return new Uint8Array(inflateSync(buf))
    } catch {
      // not zlib
    }
  }
  return buf
}

class ByteReader {
  #buf = new Uint8Array(0)
  #reader: ReadableStreamDefaultReader<Uint8Array>
  #signal?: AbortSignal
  #onAbort: () => void

  constructor(readable: ReadableStream<Uint8Array>, signal?: AbortSignal) {
    this.#reader = readable.getReader()
    this.#signal = signal
    this.#onAbort = () => {
      this.#reader.cancel(signal?.reason).catch(() => {})
    }
    signal?.addEventListener("abort", this.#onAbort, { once: true })
    if (signal?.aborted) this.#onAbort()
  }

  release() {
    this.#signal?.removeEventListener("abort", this.#onAbort)
    this.#reader.releaseLock()
  }

  #throwIfAborted() {
    if (!this.#signal?.aborted) return
    throw this.#signal.reason instanceof Error
      ? this.#signal.reason
      : new DOMException("Aborted", "AbortError")
  }

  async #pull() {
    this.#throwIfAborted()
    const { done, value } = await this.#reader.read()
    this.#throwIfAborted()
    if (done) throw new Error("Unexpected end of HTTP stream")
    if (value?.length) this.#buf = concat([this.#buf, value])
  }

  async readUntil(needle: Uint8Array): Promise<Uint8Array> {
    while (true) {
      const i = indexOf(this.#buf, needle)
      if (i !== -1) {
        const before = this.#buf.subarray(0, i)
        this.#buf = this.#buf.subarray(i + needle.length)
        return before
      }
      await this.#pull()
    }
  }

  async readExact(n: number): Promise<Uint8Array> {
    while (this.#buf.length < n) await this.#pull()
    const out = this.#buf.subarray(0, n)
    this.#buf = this.#buf.subarray(n)
    return out
  }

  async readChunkedBody(): Promise<Uint8Array> {
    const parts: Uint8Array[] = []
    while (true) {
      const sizeLine = decoder.decode(await this.readUntil(CRLF))
      const size = parseInt(sizeLine, 16)
      if (Number.isNaN(size)) throw new Error("Invalid chunk size")
      if (size === 0) {
        // consume trailing CRLF after last chunk (ignore trailers)
        await this.readExact(2)
        break
      }
      parts.push(await this.readExact(size))
      await this.readExact(2) // chunk CRLF
    }
    return concat(parts)
  }
}

/**
 * HTTP/1.1 GET over an existing duplex (Tor stream, TLS outer as bytes, …).
 * Replaces `@hazae41/fleche` fetch for this fork (no WASM).
 *
 * Frames the response by Content-Length / chunked; does not wait for EOF.
 */
export async function streamFetch(
  input: string | URL,
  init: StreamFetchInit,
): Promise<Response> {
  const { stream, signal, headers: headersInit } = init
  const url = new URL(typeof input === "string" ? input : input.href)
  const target = url.pathname + url.search

  const headers = new Headers(headersInit)
  if (!headers.has("Host")) headers.set("Host", url.host)
  if (!headers.has("Connection")) headers.set("Connection", "close")

  let head = `GET ${target} HTTP/1.1\r\n`
  headers.forEach((v, k) => {
    head += `${k}: ${v}\r\n`
  })
  head += `\r\n`

  const writer = stream.writable.getWriter()
  try {
    if (signal?.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new DOMException("Aborted", "AbortError")
    }
    await writer.write(encoder.encode(head))
    // Half-close write side (request done). Response is framed by length/chunked.
    await writer.close()
  } catch (e) {
    try {
      await writer.abort(e)
    } catch {
      // ignore
    }
    throw e
  }

  const reader = new ByteReader(stream.readable, signal)
  try {
    const headBytes = await reader.readUntil(CRLFCRLF)
    const headText = decoder.decode(headBytes)
    const lines = headText.split("\r\n")
    const statusParts = (lines[0] ?? "").split(" ")
    const status = Number(statusParts[1])
    const statusText = statusParts.slice(2).join(" ") || ""
    if (!Number.isInteger(status) || status < 200 || status > 599)
      throw new Error(`Invalid HTTP status: ${lines[0] ?? ""}`)

    const responseHeaders = new Headers()
    for (const line of lines.slice(1)) {
      if (!line) continue
      const colon = line.indexOf(":")
      if (colon === -1) continue
      responseHeaders.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim())
    }

    let bodyBytes: Uint8Array
    const transfer = responseHeaders.get("Transfer-Encoding")
    if (transfer != null && transfer.toLowerCase().includes("chunked")) {
      bodyBytes = await reader.readChunkedBody()
    } else {
      const lengthHeader = responseHeaders.get("Content-Length")
      if (lengthHeader == null)
        throw new Error("HTTP response missing Content-Length and chunked encoding")
      const length = Number(lengthHeader)
      if (!Number.isInteger(length) || length < 0)
        throw new Error(`Invalid Content-Length: ${lengthHeader}`)
      bodyBytes = await reader.readExact(length)
    }

    // Tor `.z` bodies are often raw zlib with no Content-Encoding.
    bodyBytes = maybeInflateZlib(bodyBytes)

    return new Response(bodyBytes, { status, statusText, headers: responseHeaders })
  } finally {
    reader.release()
  }
}
