/**
 * RSA PKCS#1 v1.5 unprefixed verify — used for Tor cross-certs / consensus.
 * Must agree with @hazae41/rsa.wasm on accept/reject for the same SPKI + sig.
 */
import { describe, expect, test } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
import { RsaWasm as Wasm } from "@hazae41/rsa.wasm";
import { Memory, RsaPublicKey, RsaWasm } from "../src/libs/rsa/index.ts";

function b64urlToBigInt(s: string): bigint {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return BigInt(
    "0x" +
      Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString(
        "hex",
      ),
  );
}

function modPow(b: bigint, e: bigint, m: bigint): bigint {
  let r = 1n;
  b %= m;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}

function signUnprefixed(
  privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"],
  hash: Uint8Array,
): Uint8Array {
  const jwk = privateKey.export({ format: "jwk" });
  const n = b64urlToBigInt(jwk.n!);
  const d = b64urlToBigInt(jwk.d!);
  const k = Math.ceil(n.toString(16).length / 2);
  const em = Buffer.alloc(k, 0xff);
  em[0] = 0x00;
  em[1] = 0x01;
  em[k - hash.length - 1] = 0x00;
  Buffer.from(hash).copy(em, k - hash.length);
  const s = modPow(BigInt("0x" + em.toString("hex")), d, n);
  let sigHex = s.toString(16);
  if (sigHex.length % 2) sigHex = "0" + sigHex;
  return Buffer.from(sigHex.padStart(k * 2, "0"), "hex");
}

describe("RsaPublicKey.verify_pkcs1v15_unprefixed vs @hazae41/rsa.wasm", () => {
  test("initBundled is safe to call", async () => {
    await RsaWasm.initBundled();
    await Wasm.initBundled();
  });

  for (const bits of [1024, 2048] as const) {
    test(`${bits}-bit SPKI: accept/reject matches wasm`, async () => {
      await RsaWasm.initBundled();
      await Wasm.initBundled();

      const { privateKey, publicKey } = generateKeyPairSync("rsa", {
        modulusLength: bits,
      });
      const spki = new Uint8Array(
        publicKey.export({ type: "spki", format: "der" }),
      );
      const hash = new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode("Tor TLS RSA/Ed25519 cross-certificate"),
        ),
      );
      const sig = signUnprefixed(privateKey, hash);

      const ours = RsaPublicKey.from_public_key_der(new Memory(spki));
      const wasm = Wasm.RsaPublicKey.from_public_key_der(new Wasm.Memory(spki));

      expect(
        ours.verify_pkcs1v15_unprefixed(new Memory(hash), new Memory(sig)),
      ).toBe(true);
      expect(
        wasm.verify_pkcs1v15_unprefixed(
          new Wasm.Memory(hash),
          new Wasm.Memory(sig),
        ),
      ).toBe(true);

      const bad = hash.slice();
      bad[0] ^= 1;
      expect(
        ours.verify_pkcs1v15_unprefixed(new Memory(bad), new Memory(sig)),
      ).toBe(false);
      expect(
        wasm.verify_pkcs1v15_unprefixed(
          new Wasm.Memory(bad),
          new Wasm.Memory(sig),
        ),
      ).toBe(false);

      const short = sig.subarray(0, sig.length - 1);
      expect(
        ours.verify_pkcs1v15_unprefixed(new Memory(hash), new Memory(short)),
      ).toBe(
        wasm.verify_pkcs1v15_unprefixed(
          new Wasm.Memory(hash),
          new Wasm.Memory(short),
        ),
      );
    });

    test(`${bits}-bit PKCS#1 DER import matches wasm verify`, async () => {
      await RsaWasm.initBundled();
      await Wasm.initBundled();

      const { privateKey, publicKey } = generateKeyPairSync("rsa", {
        modulusLength: bits,
      });
      const pkcs1 = new Uint8Array(
        publicKey.export({ type: "pkcs1", format: "der" }),
      );
      const hash = new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hello")),
      );
      const sig = signUnprefixed(privateKey, hash);

      const ours = RsaPublicKey.from_pkcs1_der(new Memory(pkcs1));
      const wasm = Wasm.RsaPublicKey.from_pkcs1_der(new Wasm.Memory(pkcs1));
      expect(
        ours.verify_pkcs1v15_unprefixed(new Memory(hash), new Memory(sig)),
      ).toBe(true);
      expect(
        wasm.verify_pkcs1v15_unprefixed(
          new Wasm.Memory(hash),
          new Wasm.Memory(sig),
        ),
      ).toBe(true);
    });
  }
});
