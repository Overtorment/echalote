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

  test("rejects AggregateError when every worker fails", async () => {
    await expect(
      fetchFirstOk(
        ["a", "b"],
        async (key) => {
          throw new Error(`fail ${key}`)
        },
        { concurrency: 2 },
      ),
    ).rejects.toMatchObject({
      name: "AggregateError",
      message: expect.stringMatching(/fetchFirstOk/i),
    })
  })

  test("rejects on parent abort even if a worker ignores the signal", async () => {
    const parent = new AbortController()
    const pending = fetchFirstOk(
      ["hang"],
      async () => {
        await new Promise(() => {})
        return "never"
      },
      { concurrency: 1, signal: parent.signal },
    )
    parent.abort(new Error("parent cancelled"))
    await expect(pending).rejects.toThrow(/parent cancelled/)
  })
})
