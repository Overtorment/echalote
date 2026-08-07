/**
 * Clearnet directory fetches.
 *
 * Full consensus over meek/Tor is often truncated (~3.5MB). Consumers fetch
 * consensus + microdesc bodies here, then build circuits through Tor.
 */
import { sha256 } from "@noble/hashes/sha2.js"
import { inflateSync } from "node:zlib"
import { Consensus } from "../consensus/consensus.js"

export const CONSENSUS_MIRRORS = [
  "http://193.23.244.244:80/tor/status-vote/current/consensus-microdesc", // dannenberg
  "http://171.25.193.9:443/tor/status-vote/current/consensus-microdesc", // maatuska
  "http://199.58.81.140:80/tor/status-vote/current/consensus-microdesc", // longclaw
] as const

export const AUTHORITY_HOSTS = [
  "193.23.244.244:80",
  "171.25.193.9:443",
  "199.58.81.140:80",
] as const

let cached: { at: number; consensus: Consensus } | null = null
const CACHE_MS = 30 * 60 * 1000

function sha256Base64Unpadded(bytes: Uint8Array): string {
  const hash = sha256(bytes)
  return Buffer.from(hash).toString("base64").replace(/=+$/, "")
}

function maybeInflate(buf: Buffer): Buffer {
  if (buf.length >= 2 && buf[0] === 0x78) {
    try {
      return inflateSync(buf)
    } catch {
      // not zlib
    }
  }
  return buf
}

async function fetchBytes(url: string, signal: AbortSignal): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { decompress: false, signal })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.length > 0 ? buf : null
  } catch {
    return null
  }
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j]!, items[i]!]
  }
  return items
}

export type FetchMicrodescConsensusOptions = {
  mirrors?: readonly string[]
  /** Skip the in-process cache. Default false. */
  force?: boolean
}

/**
 * Fetch + parse the microdesc consensus over clearnet HTTP.
 */
export async function fetchMicrodescConsensus(
  signal: AbortSignal = new AbortController().signal,
  options: FetchMicrodescConsensusOptions = {},
): Promise<Consensus> {
  if (!options.force && cached && Date.now() - cached.at < CACHE_MS) {
    return cached.consensus
  }

  const mirrors = shuffleInPlace([...(options.mirrors ?? CONSENSUS_MIRRORS)])
  let lastError: unknown

  for (const url of mirrors) {
    try {
      const res = await fetch(url, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.includes("directory-footer")) {
        throw new Error("truncated consensus (no directory-footer)")
      }
      const consensus = Consensus.parseOrThrow(text)
      if (consensus.microdescs.length === 0) {
        throw new Error("consensus has no microdescs")
      }
      cached = { at: Date.now(), consensus }
      return consensus
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("consensus fetch failed")
}

export type FetchMicrodescOptions = {
  authorityHosts?: readonly string[]
}

/**
 * Fetch + verify a microdescriptor body over clearnet.
 * Prefers the relay dirport, then directory authorities.
 */
export async function fetchMicrodesc(
  head: Consensus.Microdesc.Head,
  signal: AbortSignal = new AbortController().signal,
  options: FetchMicrodescOptions = {},
): Promise<Consensus.Microdesc> {
  const dig = head.microdesc
  const authorityHosts = options.authorityHosts ?? AUTHORITY_HOSTS
  const urls: string[] = []

  if (head.dirport > 0) {
    urls.push(`http://${head.hostname}:${head.dirport}/tor/micro/d/${dig}`)
    urls.push(`http://${head.hostname}:${head.dirport}/tor/micro/d/${dig}.z`)
  }
  for (const host of authorityHosts) {
    urls.push(`http://${host}/tor/micro/d/${dig}`)
    urls.push(`http://${host}/tor/micro/d/${dig}.z`)
  }

  let lastError: unknown = new Error("no microdesc URL succeeded")
  for (const url of urls) {
    try {
      const raw = await fetchBytes(url, signal)
      if (!raw) continue
      const body = maybeInflate(raw)
      const got = sha256Base64Unpadded(body)
      if (got !== dig) {
        lastError = new Error(`digest mismatch for ${url}`)
        continue
      }
      const text = body.toString("utf8")
      const [parsed] = Consensus.Microdesc.parseOrThrow(text)
      if (!parsed) throw new Error("empty microdescriptor")
      return { ...head, ...parsed }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`microdesc fetch failed for ${head.nickname}`)
}
