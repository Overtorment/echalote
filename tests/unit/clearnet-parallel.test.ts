import { describe, expect, test } from "@jest/globals"
import { fetchFirstOk } from "../../src/mods/tor/directory/clearnet.ts"

describe("fetchFirstOk", () => {
  test("returns the first successful result and cancels slower work", async () => {
    const started: string[] = []
    const cancelled: string[] = []
    const result = await fetchFirstOk(
      ["slow", "fast", "also-slow"],
      async (key, signal) => {
        started.push(key)
        if (key === "fast") return `ok:${key}`
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, 100)
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(t)
              cancelled.push(key)
              reject(signal.reason ?? new Error("aborted"))
            },
            { once: true },
          )
        })
        return `ok:${key}`
      },
      { concurrency: 3 },
    )
    expect(result).toBe("ok:fast")
    expect(started.length).toBe(3)
    await new Promise((r) => setTimeout(r, 20))
    expect(cancelled.length).toBeGreaterThanOrEqual(1)
  })

  test("tries until one succeeds within concurrency", async () => {
    let n = 0
    const result = await fetchFirstOk(
      ["a", "b", "c"],
      async (key) => {
        n++
        if (key !== "c") throw new Error(`fail ${key}`)
        return key
      },
      { concurrency: 2 },
    )
    expect(result).toBe("c")
    expect(n).toBe(3)
  })
})
