/**
 * AES-128-CTR vectors captured from @hazae41/aes.wasm@1.0.3
 * (see tests/unit/vectors/aes-ctr-wasm.json). Includes mid-block continuity
 * required for Tor RELAY payloads (509 bytes).
 */
import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Aes128Ctr128BEKey,
  AesWasm,
  Memory,
} from "../../src/libs/aes/index.ts";

const vectors = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "vectors/aes-ctr-wasm.json"), "utf8"),
) as {
  fullBlock: {
    key: string;
    iv: string;
    plain: string;
    after1: string;
    after2: string;
  };
  midBlock: {
    key: string;
    iv: string;
    chunkAPlain: string;
    chunkBPlain: string;
    chunkAAfter: string;
    chunkBAfter: string;
    fullPlain: string;
    fullAfter: string;
  };
  relay509: {
    key: string;
    iv: string;
    rounds: { round: number; plainFill: number; after: string }[];
  };
  oddLengths: {
    len: number;
    key: string;
    iv: string;
    plain: string;
    after: string;
  }[];
};

function fromHex(h: string): Uint8Array {
  return new Uint8Array(Buffer.from(h, "hex"));
}

function toHex(u: Uint8Array): string {
  return Buffer.from(u).toString("hex");
}

describe("Aes128Ctr128BEKey (wasm vectors)", () => {
  test("initBundled is safe to call", async () => {
    await AesWasm.initBundled();
  });

  test("single full block + counter advance", async () => {
    await AesWasm.initBundled();
    const { key, iv, plain, after1, after2 } = vectors.fullBlock;
    const k = new Aes128Ctr128BEKey(new Memory(fromHex(key)), new Memory(fromHex(iv)));
    const m = new Memory(fromHex(plain));
    k.apply_keystream(m);
    expect(toHex(m.bytes)).toBe(after1);
    const m2 = new Memory(new Uint8Array(16).fill(0));
    k.apply_keystream(m2);
    expect(toHex(m2.bytes)).toBe(after2);
  });

  test("mid-block offset: 1+15 equals one 16-byte call", async () => {
    await AesWasm.initBundled();
    const v = vectors.midBlock;
    const split = new Aes128Ctr128BEKey(
      new Memory(fromHex(v.key)),
      new Memory(fromHex(v.iv)),
    );
    const a = new Memory(fromHex(v.chunkAPlain));
    const b = new Memory(fromHex(v.chunkBPlain));
    split.apply_keystream(a);
    split.apply_keystream(b);
    expect(toHex(a.bytes)).toBe(v.chunkAAfter);
    expect(toHex(b.bytes)).toBe(v.chunkBAfter);

    const once = new Aes128Ctr128BEKey(
      new Memory(fromHex(v.key)),
      new Memory(fromHex(v.iv)),
    );
    const c = new Memory(fromHex(v.fullPlain));
    once.apply_keystream(c);
    expect(toHex(c.bytes)).toBe(v.fullAfter);
    expect(toHex(a.bytes) + toHex(b.bytes)).toBe(v.fullAfter);
  });

  test("consecutive 509-byte Tor relay payloads", async () => {
    await AesWasm.initBundled();
    const { key, iv, rounds } = vectors.relay509;
    const k = new Aes128Ctr128BEKey(new Memory(fromHex(key)), new Memory(fromHex(iv)));
    for (const round of rounds) {
      const plain = new Uint8Array(509);
      plain.fill(round.plainFill);
      const m = new Memory(plain);
      k.apply_keystream(m);
      expect(toHex(m.bytes)).toBe(round.after);
    }
  });

  test("fresh keys: odd lengths", async () => {
    await AesWasm.initBundled();
    for (const { key, iv, plain, after, len } of vectors.oddLengths) {
      const k = new Aes128Ctr128BEKey(
        new Memory(fromHex(key)),
        new Memory(fromHex(iv)),
      );
      const m = new Memory(fromHex(plain));
      k.apply_keystream(m);
      expect(toHex(m.bytes)).toBe(after);
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
