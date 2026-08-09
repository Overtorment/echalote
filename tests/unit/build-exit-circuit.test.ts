import { describe, expect, test } from "@jest/globals"
import {
  buildExitCircuit,
  isTransientCircuitError,
  raceFirstCircuit,
} from "../../src/mods/tor/directory/build-exit-circuit.ts"
import type { Circuit } from "../../src/mods/tor/circuit.ts"
import type { TorClientDuplex } from "../../src/mods/tor/client.ts"

function fakeCircuit(id: number): Circuit {
  return {
    id,
    async close() {},
  } as unknown as Circuit
}

describe("isTransientCircuitError", () => {
  test("treats microdesc, timeout, and destroyed as transient", () => {
    expect(
      isTransientCircuitError(new Error("no microdesc URL succeeded")),
    ).toBe(true)
    expect(
      isTransientCircuitError(new Error("The operation timed out.")),
    ).toBe(true)
    expect(
      isTransientCircuitError(new Error("Circuit destroyed")),
    ).toBe(true)
    expect(
      isTransientCircuitError(new Error("consensus fetch failed")),
    ).toBe(true)
  })

  test("does not treat unrelated errors as transient", () => {
    expect(isTransientCircuitError(new Error("peer refused"))).toBe(false)
    expect(isTransientCircuitError(new Error("disposed"))).toBe(false)
  })
})

describe("buildExitCircuit retry + race", () => {
  test("retries transient buildOnce failures up to attempts", async () => {
    let calls = 0
    const circuit = fakeCircuit(1)
    const client = {} as TorClientDuplex
    const result = await buildExitCircuit(client, undefined, {
      attempts: 3,
      circuitRace: 1,
      buildOnce: async () => {
        calls++
        if (calls < 3) throw new Error("no microdesc URL succeeded")
        return circuit
      },
    })
    expect(result).toBe(circuit)
    expect(calls).toBe(3)
  })

  test("does not retry non-transient errors", async () => {
    let calls = 0
    const client = {} as TorClientDuplex
    await expect(
      buildExitCircuit(client, undefined, {
        attempts: 5,
        circuitRace: 1,
        buildOnce: async () => {
          calls++
          throw new Error("peer refused")
        },
      }),
    ).rejects.toThrow(/peer refused/)
    expect(calls).toBe(1)
  })

  test("races parallel builds and closes losers", async () => {
    const client = {} as TorClientDuplex
    const closed: number[] = []
    let started = 0
    const result = await buildExitCircuit(client, undefined, {
      attempts: 1,
      circuitRace: 2,
      buildOnce: async () => {
        const id = ++started
        if (id === 1) await new Promise((r) => setTimeout(r, 80))
        return {
          id,
          async close() {
            closed.push(id)
          },
        } as unknown as Circuit
      },
    })
    expect((result as unknown as { id: number }).id).toBe(2)
    await new Promise((r) => setTimeout(r, 120))
    expect(closed).toContain(1)
  })

  test("rejects non-integer circuitRace", async () => {
    const client = {} as TorClientDuplex
    await expect(
      buildExitCircuit(client, undefined, {
        circuitRace: Number.NaN,
        buildOnce: async () => fakeCircuit(1),
      }),
    ).rejects.toThrow(/positive integer/i)
    await expect(
      buildExitCircuit(client, undefined, {
        circuitRace: 1.5,
        buildOnce: async () => fakeCircuit(1),
      }),
    ).rejects.toThrow(/positive integer/i)
  })
})

describe("raceFirstCircuit", () => {
  test("rejects when parent aborts even if a builder ignores the signal", async () => {
    const parent = new AbortController()
    const pending = raceFirstCircuit(
      1,
      async () => {
        // Ignore signal on purpose — parent abort must still settle.
        await new Promise(() => {})
        return fakeCircuit(1)
      },
      parent.signal,
    )
    await Promise.resolve()
    parent.abort(new Error("parent cancelled"))
    await expect(pending).rejects.toThrow(/parent cancelled/)
  })

  test("does not abort the winner signal after settle", async () => {
    const winnerSignals: AbortSignal[] = []
    const circuit = await raceFirstCircuit(
      2,
      async (signal) => {
        winnerSignals.push(signal)
        if (winnerSignals.length === 1) {
          await new Promise((r) => setTimeout(r, 50))
          if (signal.aborted) throw signal.reason ?? new Error("aborted")
        }
        return fakeCircuit(winnerSignals.length)
      },
    )
    expect((circuit as unknown as { id: number }).id).toBe(2)
    expect(winnerSignals[1]!.aborted).toBe(false)
  })
})
