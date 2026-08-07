import { Circuit } from "../circuit.js"
import { TorClientDuplex } from "../client.js"
import { Consensus } from "../consensus/consensus.js"
import { fetchMicrodesc, fetchMicrodescConsensus } from "./clearnet.js"

export type BuildExitCircuitOptions = {
  /** Clearnet consensus mirror URLs. */
  consensusUrls?: readonly string[]
  /** Per-extend timeout. Default 15s. */
  extendTimeoutMs?: number
  /** How many times to rebuild after destroyed-circuit errors. Default 3. */
  attempts?: number
  /** Candidates to try when fetching a full microdesc. Default 8. */
  pickTries?: number
}

function isDestroyedCircuitError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err)
  return (
    msg.includes("Circuit destroyed") ||
    msg.includes("DestroyedError") ||
    msg.includes("Relay ended") ||
    msg.includes("RelayEndedError")
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
 * Build a 3-hop exit circuit using clearnet directory data + Tor extends.
 */
export async function buildExitCircuit(
  client: TorClientDuplex,
  signal: AbortSignal = new AbortController().signal,
  options: BuildExitCircuitOptions = {},
): Promise<Circuit> {
  const extendTimeoutMs = options.extendTimeoutMs ?? 15_000
  const attempts = options.attempts ?? 3
  const pickTries = options.pickTries ?? 8

  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await buildExitCircuitOnce(client, signal, {
        consensusUrls: options.consensusUrls,
        extendTimeoutMs,
        pickTries,
      })
    } catch (err) {
      lastError = err
      if (signal.aborted || !isDestroyedCircuitError(err)) break
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("extend circuit failed", { cause: lastError })
}
