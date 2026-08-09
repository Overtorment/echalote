import { Circuit } from "../circuit.ts"
import { TorClientDuplex } from "../client.ts"
import { Consensus } from "../consensus/consensus.ts"
import { fetchMicrodesc, fetchMicrodescConsensus } from "./clearnet.ts"

export type BuildExitCircuitOptions = {
  /** Clearnet consensus mirror URLs. */
  consensusUrls?: readonly string[]
  /** Per-extend timeout. Default 15s. */
  extendTimeoutMs?: number
  /**
   * How many race rounds to try after transient failures.
   * Each round starts `circuitRace` parallel builds. Default 3.
   */
  attempts?: number
  /** Parallel circuit builds per round. First success wins. Default 2. */
  circuitRace?: number
  /** Candidates to try when fetching a full microdesc. Default 8. */
  pickTries?: number
  /**
   * Test seam: replace the single-circuit builder used inside each race slot.
   * Receives a signal that is aborted when another racer wins.
   */
  buildOnce?: (
    client: TorClientDuplex,
    signal: AbortSignal,
    options: Required<
      Pick<BuildExitCircuitOptions, "extendTimeoutMs" | "pickTries">
    > & {
      consensusUrls?: readonly string[]
    },
  ) => Promise<Circuit>
}

export function isTransientCircuitError(err: unknown): boolean {
  const msg =
    err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err)
  const lower = msg.toLowerCase()
  return (
    lower.includes("circuit destroyed") ||
    lower.includes("destroyederror") ||
    lower.includes("relay ended") ||
    lower.includes("relayendederror") ||
    lower.includes("no microdesc url succeeded") ||
    lower.includes("microdesc fetch failed") ||
    lower.includes("consensus fetch failed") ||
    lower.includes("no extendable relays") ||
    lower.includes("truncated consensus") ||
    lower.includes("timed out") ||
    lower.includes("timeouterror") ||
    /http \d{3}/i.test(msg)
  )
}

async function pickExtendable(
  pool: Consensus.Microdesc.Head[],
  signal: AbortSignal,
  tries: number,
): Promise<Consensus.Microdesc> {
  const remaining = [...pool]
  let lastError: unknown = new Error("no extendable relays")
  for (let i = 0; i < tries && remaining.length > 0; i++) {
    const idx = Math.floor(Math.random() * remaining.length)
    const [head] = remaining.splice(idx, 1)
    if (!head) break
    try {
      return await fetchMicrodesc(head, signal)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error("no extendable relays")
}

async function buildExitCircuitOnce(
  client: TorClientDuplex,
  signal: AbortSignal,
  options: Required<Pick<BuildExitCircuitOptions, "extendTimeoutMs" | "pickTries">> & {
    consensusUrls?: readonly string[]
  },
): Promise<Circuit> {
  const circuit = await client.createOrThrow(signal)
  try {
    const consensus = await fetchMicrodescConsensus(signal, {
      mirrors: options.consensusUrls,
    })
    const middles = consensus.microdescs.filter(
      (it) =>
        it.flags.includes("Fast") &&
        it.flags.includes("Stable") &&
        it.flags.includes("V2Dir"),
    )
    const exits = consensus.microdescs.filter(
      (it) =>
        it.flags.includes("Fast") &&
        it.flags.includes("Stable") &&
        it.flags.includes("Exit") &&
        !it.flags.includes("BadExit"),
    )
    if (middles.length === 0 || exits.length === 0) {
      throw new Error(
        `tor consensus missing usable relays (middles=${middles.length} exits=${exits.length})`,
      )
    }

    const middleFull = await pickExtendable(middles, signal, options.pickTries)
    await circuit.extendOrThrow(
      middleFull,
      AbortSignal.any([signal, AbortSignal.timeout(options.extendTimeoutMs)]),
    )

    const exitFull = await pickExtendable(
      exits.filter((e) => e.identity !== middleFull.identity),
      signal,
      options.pickTries,
    )
    await circuit.extendOrThrow(
      exitFull,
      AbortSignal.any([signal, AbortSignal.timeout(options.extendTimeoutMs)]),
    )

    return circuit
  } catch (err) {
    try {
      await circuit.close()
    } catch {
      // ignore
    }
    throw err
  }
}

/**
 * Race `raceCount` builders. First success wins; abort losers and close late finishers.
 */
export async function raceFirstCircuit(
  raceCount: number,
  build: (signal: AbortSignal) => Promise<Circuit>,
  signal: AbortSignal = new AbortController().signal,
): Promise<Circuit> {
  if (raceCount < 1) throw new Error("circuitRace must be >= 1")
  if (signal.aborted) throw signal.reason ?? new Error("aborted")

  const localControllers = Array.from(
    { length: raceCount },
    () => new AbortController(),
  )
  const abortLocals = () => {
    for (const c of localControllers) {
      try {
        c.abort(signal.reason ?? new Error("circuit race lost"))
      } catch {
        // ignore
      }
    }
  }
  const onParentAbort = () => abortLocals()
  signal.addEventListener("abort", onParentAbort, { once: true })

  let settled = false
  const errors: unknown[] = []
  let remaining = raceCount

  try {
    return await new Promise<Circuit>((resolve, reject) => {
      for (const local of localControllers) {
        const linked = AbortSignal.any([signal, local.signal])
        void build(linked).then(
          (circuit) => {
            if (settled) {
              void circuit.close().catch(() => {})
              return
            }
            settled = true
            abortLocals()
            resolve(circuit)
          },
          (err) => {
            errors.push(err)
            remaining -= 1
            if (!settled && remaining === 0) {
              reject(
                errors.find((e) => e instanceof Error) ??
                  new Error("circuit race failed", { cause: errors[0] }),
              )
            }
          },
        )
      }
    })
  } finally {
    signal.removeEventListener("abort", onParentAbort)
  }
}

/**
 * Build a 3-hop exit circuit using clearnet directory data + Tor extends.
 * Retries transient directory/extend failures and races parallel builds.
 */
export async function buildExitCircuit(
  client: TorClientDuplex,
  signal: AbortSignal = new AbortController().signal,
  options: BuildExitCircuitOptions = {},
): Promise<Circuit> {
  const extendTimeoutMs = options.extendTimeoutMs ?? 15_000
  const attempts = options.attempts ?? 3
  const circuitRace = options.circuitRace ?? 2
  const pickTries = options.pickTries ?? 8
  const once = options.buildOnce ?? buildExitCircuitOnce
  const onceOpts = {
    consensusUrls: options.consensusUrls,
    extendTimeoutMs,
    pickTries,
  }

  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new Error("aborted")
    }
    try {
      return await raceFirstCircuit(
        circuitRace,
        (raceSignal) => once(client, raceSignal, onceOpts),
        signal,
      )
    } catch (err) {
      lastError = err
      if (signal.aborted || !isTransientCircuitError(err)) break
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("extend circuit failed", { cause: lastError })
}
