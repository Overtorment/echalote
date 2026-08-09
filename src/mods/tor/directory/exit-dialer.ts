/**
 * High-level clearnet dial over meek + exit circuit.
 * Onion-service (HS) client is not implemented.
 */
import { createMeekStream, DEFAULT_MEEK_URL } from "../../meek/meek.ts"
import { Circuit } from "../circuit.ts"
import { TorClientDuplex } from "../client.ts"
import { TorStreamDuplex } from "../stream.ts"
import {
  buildExitCircuit,
  isTransientCircuitError,
} from "./build-exit-circuit.ts"

export type ExitDialer = {
  /** RELAY_BEGIN to host:port via a Tor exit. `stream.outer` is Uint8Array. */
  dial(
    host: string,
    port: number,
    signal?: AbortSignal,
  ): Promise<TorStreamDuplex>
  dispose(): Promise<void>
}

export type ExitDialerOptions = {
  meekUrl?: string
  extendTimeoutMs?: number
  /** Timeout for RELAY_BEGIN / stream open. Default 20s. */
  openTimeoutMs?: number
  /**
   * Race rounds for exit-circuit build after transient failures.
   * Default 3 (see `buildExitCircuit` `attempts`).
   */
  circuitAttempts?: number
  /** Parallel circuit builds per round. Default 2. */
  circuitRace?: number
}

function errorDetail(err: unknown): string {
  if (err instanceof Error) {
    const cause =
      err.cause instanceof Error
        ? ` ← ${err.cause.message}`
        : err.cause != null
          ? ` ← ${String(err.cause)}`
          : ""
    return `${err.message}${cause}`
  }
  return String(err)
}

function wrapDialError(stage: string, err: unknown): Error {
  const out = new Error(`tor ${stage}: ${errorDetail(err)}`)
  out.cause = err
  return out
}

/** Close the exit circuit when the stream is closed. */
function bindCircuitLifetime(
  stream: TorStreamDuplex,
  circuit: Circuit,
): TorStreamDuplex {
  const origClose = stream.close.bind(stream)
  stream.close = () => {
    origClose()
    void circuit.close().catch(() => {})
  }
  return stream
}

/**
 * Meek → Tor client → exit circuit → `openOrThrow(host, port)`.
 * Reuses one Tor client across dials; rebuilds on destroy.
 */
export function createExitDialer(
  options: ExitDialerOptions = {},
): ExitDialer {
  const meekUrl = options.meekUrl ?? DEFAULT_MEEK_URL
  const extendTimeoutMs = options.extendTimeoutMs ?? 15_000
  const openTimeoutMs = options.openTimeoutMs ?? 20_000
  const circuitAttempts = options.circuitAttempts ?? 3
  const circuitRace = options.circuitRace ?? 2

  let tor: TorClientDuplex | null = null
  let ready: Promise<void> | null = null
  let disposed = false

  function resetTor(): void {
    try {
      tor?.close()
    } catch {
      // ignore
    }
    tor = null
    ready = null
  }

  async function ensureTor(signal: AbortSignal): Promise<TorClientDuplex> {
    if (disposed) throw new Error("exit dialer disposed")
    if (tor?.closed != null) {
      resetTor()
    }
    if (tor) return tor
    if (!ready) {
      ready = (async () => {
        try {
          const meek = await createMeekStream(meekUrl)
          const client = new TorClientDuplex()
          meek.duplex.outer.readable
            .pipeTo(client.inner.writable)
            .catch(() => {
              if (tor === client) resetTor()
            })
          client.inner.readable
            .pipeTo(meek.duplex.outer.writable)
            .catch(() => {
              if (tor === client) resetTor()
            })
          await client.waitOrThrow(signal)
          tor = client
        } catch (err) {
          ready = null
          throw wrapDialError("bootstrap", err)
        }
      })()
    }
    try {
      await ready
    } catch (err) {
      throw err instanceof Error && err.message.startsWith("tor ")
        ? err
        : wrapDialError("bootstrap", err)
    }
    if (!tor) throw new Error("tor client failed to start")
    return tor
  }

  async function makeExitCircuit(
    client: TorClientDuplex,
    signal: AbortSignal,
  ): Promise<Circuit> {
    try {
      return await buildExitCircuit(client, signal, {
        extendTimeoutMs,
        attempts: circuitAttempts,
        circuitRace,
      })
    } catch (err) {
      throw err instanceof Error && err.message.startsWith("tor ")
        ? err
        : wrapDialError("extend circuit", err)
    }
  }

  return {
    async dial(host, port, signal = new AbortController().signal) {
      let client = await ensureTor(signal)
      let circuit: Circuit
      try {
        circuit = await makeExitCircuit(client, signal)
      } catch (err) {
        // One meek/bootstrap recycle after the circuit budget fails.
        if (isTransientCircuitError(err) && !signal.aborted) {
          resetTor()
          client = await ensureTor(signal)
          circuit = await makeExitCircuit(client, signal)
        } else {
          throw err instanceof Error && err.message.startsWith("tor ")
            ? err
            : wrapDialError("extend circuit", err)
        }
      }
      try {
        const openSignal = AbortSignal.any([
          signal,
          AbortSignal.timeout(openTimeoutMs),
        ])
        const stream = await circuit.openOrThrow(
          host,
          port,
          { wait: true },
          openSignal,
        )
        return bindCircuitLifetime(stream, circuit)
      } catch (err) {
        try {
          await circuit.close()
        } catch {
          // ignore
        }
        throw wrapDialError(`open ${host}:${port}`, err)
      }
    },
    async dispose() {
      disposed = true
      resetTor()
    },
  }
}
