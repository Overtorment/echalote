/**
 * AES-128-CTR keystream API used by Tor relay cells.
 * Vectors captured from @hazae41/aes.wasm so a Noble/pure replacement must match.
 */
import { describe, expect, test } from "bun:test";
import {
  Aes128Ctr128BEKey,
  AesWasm,
  Memory,
} from "../src/libs/aes/index.ts";

describe("Aes128Ctr128BEKey (relay crypto)", () => {
  test("initBundled is safe to call", async () => {
    await AesWasm.initBundled();
  });

  test("apply_keystream matches known vector and advances counter", async () => {
    await AesWasm.initBundled();
    const key = new Uint8Array(16).fill(1);
    const iv = new Uint8Array(16).fill(2);
    const k = new Aes128Ctr128BEKey(new Memory(key), new Memory(iv));

    const mem = new Memory(
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    );
    k.apply_keystream(mem);
    expect([...mem.bytes]).toEqual([
      22, 212, 23, 247, 124, 175, 50, 152, 126, 227, 94, 123, 240, 63, 205, 26,
    ]);

    const mem2 = new Memory(new Uint8Array(16).fill(0));
    k.apply_keystream(mem2);
    expect([...mem2.bytes]).toEqual([
      35, 141, 141, 98, 248, 146, 158, 245, 212, 217, 6, 43, 240, 251, 119, 93,
    ]);
  });

  test("Memory exposes mutable bytes", () => {
    const m = new Memory(new Uint8Array([9, 8, 7]));
    expect(m.len()).toBe(3);
    expect([...m.bytes]).toEqual([9, 8, 7]);
    m.bytes[0] = 1;
    expect(m.bytes[0]).toBe(1);
  });
});
