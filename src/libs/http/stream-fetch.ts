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

function parseChunked(body: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = []
  let offset = 0
  while (offset < body.length) {
    const lineEnd = indexOf(body, CRLF, offset)
    if (lineEnd === -1) throw new Error("Invalid chunked encoding: missing chunk size")
    const size = parseInt(decoder.decode(body.subarray(offset, lineEnd)), 16)
    if (Number.isNaN(size)) throw new Error("Invalid chunk size")
    offset = lineEnd + 2
    if (size === 0) break
    if (offset + size + 2 > body.length)
      throw new Error("Invalid chunked encoding: truncated chunk")
    parts.push(body.subarray(offset, offset + size))
    offset += size + 2
  }
  return concat(parts)
}

async function readAll(
  readable: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const reader = readable.getReader()
  const onAbort = () => {
    reader.cancel(signal?.reason).catch(() => {})
  }
  signal?.addEventListener("abort", onAbort, { once: true })
  if (signal?.aborted) onAbort()

  const chunks: Uint8Array[] = []
  try {
    while (true) {
      if (signal?.aborted) {
        throw signal.reason instanceof Error
          ? signal.reason
          : new DOMException("Aborted", "AbortError")
      }
      const { done, value } = await reader.read()
      if (done) break
      if (value?.length) chunks.push(value)
    }
  } finally {
    signal?.removeEventListener("abort", onAbort)
  }
  return concat(chunks)
}

/**
 * HTTP/1.1 GET over an existing duplex (Tor stream, TLS outer as bytes, …).
 * Replaces `@hazae41/fleche` fetch for this fork (no WASM).
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
    await writer.close()
  } catch (e) {
    try {
      await writer.abort(e)
    } catch {
      // ignore
    }
    throw e
  }

  const raw = await readAll(stream.readable, signal)
  const split = indexOf(raw, CRLFCRLF)
  if (split === -1) throw new Error("Invalid HTTP response: missing header terminator")

  const headText = decoder.decode(raw.subarray(0, split))
  let bodyBytes = raw.subarray(split + 4)

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

  const transfer = responseHeaders.get("Transfer-Encoding")
  if (transfer != null && transfer.toLowerCase().includes("chunked")) {
    bodyBytes = parseChunked(bodyBytes)
  } else {
    const lengthHeader = responseHeaders.get("Content-Length")
    if (lengthHeader != null) {
      const length = Number(lengthHeader)
      if (!Number.isNaN(length)) bodyBytes = bodyBytes.subarray(0, length)
    }
  }

  // Tor `.z` bodies are often raw zlib with no Content-Encoding.
  bodyBytes = maybeInflateZlib(bodyBytes)

  return new Response(bodyBytes, { status, statusText, headers: responseHeaders })
}
