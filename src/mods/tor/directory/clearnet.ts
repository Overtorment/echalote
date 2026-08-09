/**
 * Clearnet directory fetches.
 *
 * Full consensus over meek/Tor is often truncated (~3.5MB). Consumers fetch
 * consensus + microdesc bodies here, then build circuits through Tor.
 */
import { sha256 } from "@noble/hashes/sha2.js"
import { inflateSync } from "node:zlib"
import { Consensus } from "../consensus/consensus.ts"

/**
 * v3 directory authorities (dirport), from tor `auth_dirs.inc`.
 * Serge (bridge authority) omitted — not a consensus voter for clients.
 */
export const AUTHORITY_HOSTS = [
  "128.31.0.39:9231", // moria1
  "217.196.147.77:80", // tor26
  "45.66.35.11:80", // dizum
  "131.188.40.189:80", // gabelmoo
  "193.23.244.244:80", // dannenberg
  "171.25.193.9:443", // maatuska
  "199.58.81.140:80", // longclaw
  "204.13.164.118:80", // bastet
  "216.218.219.41:80", // faravahar
] as const

export const CONSENSUS_MIRRORS = AUTHORITY_HOSTS.map(
  (host) => `http://${host}/tor/status-vote/current/consensus-microdesc`,
)

let cached: { at: number; consensus: Consensus } | null = null
const CACHE_MS = 30 * 60 * 1000

/** Cap each GET so a hung host cannot burn the whole abort budget. */
const MICRODESC_FETCH_MS = 8_000
/** Full microdesc consensus is ~3.5MB; allow more headroom than microdescs. */
const CONSENSUS_FETCH_MS = 30_000

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

function withFetchTimeout(signal: AbortSignal, ms: number): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(ms)])
}

async function fetchBytes(url: string, signal: AbortSignal): Promise<Buffer | null> {
  try {
    // Tor `.z` bodies are often raw zlib without Content-Encoding.
    // Bun's fetch tries to inflate them and throws ZlibError unless decompress
    // is disabled; Node ignores the unknown option / does not auto-inflate.
    const init: RequestInit & { decompress?: boolean } = {
      signal: withFetchTimeout(signal, MICRODESC_FETCH_MS),
      decompress: false,
    }
    const res = await fetch(url, init)
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

/**
 * Run workers over `items` with a concurrency cap. First success wins;
 * abort remaining in-flight work. Throws an `AggregateError` with every
 * worker failure if all items fail.
 */
export async function fetchFirstOk<T, R>(
  items: readonly T[],
  worker: (item: T, signal: AbortSignal) => Promise<R>,
  options: { concurrency?: number; signal?: AbortSignal } = {},
): Promise<R> {
  const concurrency = Math.max(1, options.concurrency ?? 4)
  const parent = options.signal ?? new AbortController().signal
  if (items.length === 0) throw new Error("fetchFirstOk: empty items")
  if (parent.aborted) throw parent.reason ?? new Error("aborted")

  let cursor = 0
  let inFlight = 0
  let settled = false
  const errors: unknown[] = []
  const localControllers: AbortController[] = []

  return await new Promise<R>((resolve, reject) => {
    const settleReject = (err: unknown) => {
      if (settled) return
      settled = true
      parent.removeEventListener("abort", onParentAbort)
      reject(err)
    }
    const settleResolve = (value: R) => {
      if (settled) return
      settled = true
      parent.removeEventListener("abort", onParentAbort)
      for (const c of localControllers) {
        try {
          c.abort(new Error("fetchFirstOk: lost race"))
        } catch {
          // ignore
        }
      }
      resolve(value)
    }

    const onParentAbort = () => {
      const reason = parent.reason ?? new Error("aborted")
      for (const c of localControllers) {
        try {
          c.abort(reason)
        } catch {
          // ignore
        }
      }
      settleReject(reason)
    }
    parent.addEventListener("abort", onParentAbort, { once: true })

    const failIfDone = () => {
      if (settled) return
      if (cursor >= items.length && inFlight === 0) {
        settleReject(new AggregateError(errors, "fetchFirstOk: all failed"))
      }
    }

    const launch = () => {
      while (!settled && inFlight < concurrency && cursor < items.length) {
        if (parent.aborted) {
          settleReject(parent.reason ?? new Error("aborted"))
          return
        }
        const item = items[cursor]!
        cursor += 1
        inFlight += 1
        const local = new AbortController()
        localControllers.push(local)
        const linked = AbortSignal.any([parent, local.signal])
        void worker(item, linked).then(
          (value) => {
            inFlight -= 1
            settleResolve(value)
          },
          (err) => {
            inFlight -= 1
            errors.push(err)
            if (!settled) {
              if (cursor < items.length) launch()
              else failIfDone()
            }
          },
        )
      }
      failIfDone()
    }

    launch()
  })
}
export type FetchMicrodescConsensusOptions = {
  mirrors?: readonly string[]
  /** Skip the in-process cache. Default false. */
  force?: boolean
  /** Parallel mirror GETs. Default 3. */
  concurrency?: number
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
  const consensus = await fetchFirstOk(
    mirrors,
    async (url, raceSignal) => {
      const res = await fetch(url, {
        signal: withFetchTimeout(raceSignal, CONSENSUS_FETCH_MS),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.includes("directory-footer")) {
        throw new Error("truncated consensus (no directory-footer)")
      }
      const parsed = Consensus.parseOrThrow(text)
      if (parsed.microdescs.length === 0) {
        throw new Error("consensus has no microdescs")
      }
      return parsed
    },
    { concurrency: options.concurrency ?? 3, signal },
  )

  cached = { at: Date.now(), consensus }
  return consensus
}

export type FetchMicrodescOptions = {
  authorityHosts?: readonly string[]
  /** Parallel microdesc GETs. Default 4. */
  concurrency?: number
}

/**
 * Fetch + verify a microdescriptor body over clearnet.
 * Prefers directory authorities, then the relay dirport.
 */
export async function fetchMicrodesc(
  head: Consensus.Microdesc.Head,
  signal: AbortSignal = new AbortController().signal,
  options: FetchMicrodescOptions = {},
): Promise<Consensus.Microdesc> {
  const dig = head.microdesc
  const authorityHosts = options.authorityHosts ?? AUTHORITY_HOSTS
  // Prefer directory authorities: many relay dirports are firewalled or hang
  // from CI/cloud networks and would otherwise burn the whole abort budget.
  const urls: string[] = []
  for (const host of authorityHosts) {
    urls.push(`http://${host}/tor/micro/d/${dig}.z`)
    urls.push(`http://${host}/tor/micro/d/${dig}`)
  }
  if (head.dirport > 0) {
    urls.push(`http://${head.hostname}:${head.dirport}/tor/micro/d/${dig}.z`)
    urls.push(`http://${head.hostname}:${head.dirport}/tor/micro/d/${dig}`)
  }

  try {
    return await fetchFirstOk(
      urls,
      async (url, raceSignal) => {
        const raw = await fetchBytes(url, raceSignal)
        if (!raw) throw new Error(`empty body from ${url}`)
        const body = maybeInflate(raw)
        const got = sha256Base64Unpadded(body)
        if (got !== dig) throw new Error(`digest mismatch for ${url}`)
        const text = body.toString("utf8")
        const [parsed] = Consensus.Microdesc.parseOrThrow(text)
        if (!parsed) throw new Error("empty microdescriptor")
        return { ...head, ...parsed }
      },
      { concurrency: options.concurrency ?? 4, signal },
    )
  } catch (err) {
    if (signal.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : err instanceof Error
          ? err
          : new Error("aborted")
    }
    // Stable message for isTransientCircuitError / dialer retry paths.
    throw new Error("no microdesc URL succeeded", { cause: err })
  }
}
