import { describe, expect, test } from "@jest/globals"
import { createExitDialer } from "../../src/mods/tor/directory/exit-dialer.ts"

describe("createExitDialer", () => {
  test("returns dial + dispose", () => {
    const dialer = createExitDialer()
    expect(typeof dialer.dial).toBe("function")
    expect(typeof dialer.dispose).toBe("function")
  })

  test("dispose is idempotent before bootstrap", async () => {
    const dialer = createExitDialer()
    await dialer.dispose()
    await dialer.dispose()
    await expect(
      dialer.dial("example.com", 80, AbortSignal.timeout(1000)),
    ).rejects.toThrow(/disposed/i)
  })
})
