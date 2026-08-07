/**
 * RSA PKCS#1 v1.5 unprefixed verify — used for Tor cross-certs / consensus.
 * Vectors captured from @hazae41/rsa.wasm@1.0.14 (tests/unit/vectors/rsa-pkcs1v15-wasm.json).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Memory, RsaPublicKey, RsaWasm } from "../../src/libs/rsa/index.ts";

const vectors = JSON.parse(
  readFileSync(join(import.meta.dirname, "vectors/rsa-pkcs1v15-wasm.json"), "utf8"),
) as {
  cases: {
    bits: number;
    spki: string;
    pkcs1: string;
    hash: string;
    signature: string;
    wasm: { good: boolean; badHash: boolean; shortSig: boolean };
    pkcs1Case: { hash: string; signature: string; wasmGood: boolean };
  }[];
};

function fromHex(h: string): Uint8Array {
  return new Uint8Array(Buffer.from(h, "hex"));
}

describe("RsaPublicKey.verify_pkcs1v15_unprefixed (wasm vectors)", () => {
  test("initBundled is safe to call", async () => {
    await RsaWasm.initBundled();
  });

  for (const c of vectors.cases) {
    test(`${c.bits}-bit SPKI accept/reject`, async () => {
      await RsaWasm.initBundled();
      const pub = RsaPublicKey.from_public_key_der(new Memory(fromHex(c.spki)));
      const hash = fromHex(c.hash);
      const sig = fromHex(c.signature);

      expect(
        pub.verify_pkcs1v15_unprefixed(new Memory(hash), new Memory(sig)),
      ).toBe(c.wasm.good);

      const bad = hash.slice();
      bad[0] ^= 1;
      expect(
        pub.verify_pkcs1v15_unprefixed(new Memory(bad), new Memory(sig)),
      ).toBe(c.wasm.badHash);

      const short = sig.subarray(0, sig.length - 1);
      expect(
        pub.verify_pkcs1v15_unprefixed(new Memory(hash), new Memory(short)),
      ).toBe(c.wasm.shortSig);
    });

    test(`${c.bits}-bit PKCS#1 DER import`, async () => {
      await RsaWasm.initBundled();
      const pub = RsaPublicKey.from_pkcs1_der(new Memory(fromHex(c.pkcs1)));
      expect(
        pub.verify_pkcs1v15_unprefixed(
          new Memory(fromHex(c.pkcs1Case.hash)),
          new Memory(fromHex(c.pkcs1Case.signature)),
        ),
      ).toBe(c.pkcs1Case.wasmGood);
    });
  }
});
