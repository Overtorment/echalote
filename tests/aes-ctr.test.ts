/**
 * AES-128-CTR must match @hazae41/aes.wasm byte-for-byte, including mid-block
 * keystream continuity across apply_keystream calls (Tor RELAY payloads are 509 bytes).
 */
import { describe, expect, test } from "bun:test";
import {
  Aes128Ctr128BEKey as WasmKey,
  AesWasm as Wasm,
} from "@hazae41/aes.wasm";
import {
  Aes128Ctr128BEKey,
  AesWasm,
  Memory,
} from "../src/libs/aes/index.ts";

function bytesEq(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

describe("Aes128Ctr128BEKey vs @hazae41/aes.wasm", () => {
  test("initBundled is safe to call", async () => {
    await AesWasm.initBundled();
    await Wasm.initBundled();
  });

  test("single full block matches wasm vector", async () => {
    await AesWasm.initBundled();
    await Wasm.initBundled();
    const key = new Uint8Array(16).fill(1);
    const iv = new Uint8Array(16).fill(2);
    const plain = new Uint8Array([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);

    const ours = new Aes128Ctr128BEKey(new Memory(key), new Memory(iv));
    const wasm = new WasmKey(new Wasm.Memory(key), new Wasm.Memory(iv));
    const om = new Memory(plain.slice());
    const wm = new Wasm.Memory(plain.slice());
    ours.apply_keystream(om);
    wasm.apply_keystream(wm);
    expect([...om.bytes]).toEqual([...wm.bytes]);
    expect([...om.bytes]).toEqual([
      22, 212, 23, 247, 124, 175, 50, 152, 126, 227, 94, 123, 240, 63, 205, 26,
    ]);
  });

  test("mid-block offset: 1+15 bytes equals one 16-byte call", async () => {
    await AesWasm.initBundled();
    await Wasm.initBundled();
    const key = new Uint8Array(16).fill(1);
    const iv = new Uint8Array(16).fill(2);

    const split = new Aes128Ctr128BEKey(new Memory(key), new Memory(iv));
    const a = new Memory(new Uint8Array([0x11]));
    const b = new Memory(new Uint8Array(15).fill(0x22));
    split.apply_keystream(a);
    split.apply_keystream(b);

    const once = new Aes128Ctr128BEKey(new Memory(key), new Memory(iv));
    const full = new Uint8Array(16);
    full[0] = 0x11;
    full.fill(0x22, 1);
    const c = new Memory(full);
    once.apply_keystream(c);

    const concat = new Uint8Array([...a.bytes, ...b.bytes]);
    expect([...concat]).toEqual([...c.bytes]);

    const wSplit = new WasmKey(new Wasm.Memory(key), new Wasm.Memory(iv));
    const wa = new Wasm.Memory(new Uint8Array([0x11]));
    const wb = new Wasm.Memory(new Uint8Array(15).fill(0x22));
    wSplit.apply_keystream(wa);
    wSplit.apply_keystream(wb);
    expect([...concat]).toEqual([...wa.bytes, ...wb.bytes]);
  });

  test("consecutive 509-byte Tor relay payloads match wasm", async () => {
    await AesWasm.initBundled();
    await Wasm.initBundled();
    const key = new Uint8Array(16).fill(7);
    const iv = new Uint8Array(16); // echalote uses zero IV after ntor
    const ours = new Aes128Ctr128BEKey(new Memory(key), new Memory(iv));
    const wasm = new WasmKey(new Wasm.Memory(key), new Wasm.Memory(iv));

    for (let round = 0; round < 8; round++) {
      const plain = new Uint8Array(509);
      plain.fill(round);
      const om = new Memory(plain.slice());
      const wm = new Wasm.Memory(plain.slice());
      ours.apply_keystream(om);
      wasm.apply_keystream(wm);
      expect(bytesEq(om.bytes, wm.bytes)).toBe(true);
    }
  });

  test("fresh keys: odd lengths match wasm", async () => {
    await AesWasm.initBundled();
    await Wasm.initBundled();
    for (const len of [1, 15, 16, 17, 31, 32, 100, 509, 1024]) {
      const key = new Uint8Array(16);
      for (let i = 0; i < 16; i++) key[i] = (i * 7 + 3) & 0xff;
      const iv = new Uint8Array(16).fill(2);
      const plain = new Uint8Array(len);
      for (let i = 0; i < len; i++) plain[i] = i & 0xff;

      const ours = new Aes128Ctr128BEKey(new Memory(key), new Memory(iv));
      const wasm = new WasmKey(new Wasm.Memory(key), new Wasm.Memory(iv));
      const om = new Memory(plain.slice());
      const wm = new Wasm.Memory(plain.slice());
      ours.apply_keystream(om);
      wasm.apply_keystream(wm);
      expect(bytesEq(om.bytes, wm.bytes), `len=${len}`).toBe(true);
    }
  });

  test("Memory exposes mutable bytes", () => {
    const m = new Memory(new Uint8Array([9, 8, 7]));
    expect(m.len()).toBe(3);
    expect([...m.bytes]).toEqual([9, 8, 7]);
    m.bytes[0] = 1;
    expect(m.bytes[0]).toBe(1);
  });
});
