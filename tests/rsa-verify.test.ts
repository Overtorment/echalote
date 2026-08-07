/**
 * RSA PKCS#1 v1.5 unprefixed verify — used for Tor cross-certs / consensus.
 */
import { describe, expect, test } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
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

describe("RsaPublicKey.verify_pkcs1v15_unprefixed", () => {
  test("initBundled is safe to call", async () => {
    await RsaWasm.initBundled();
  });

  test("verifies unprefixed SHA-256 digest signatures", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 1024,
    });
    const spki = new Uint8Array(
      publicKey.export({ type: "spki", format: "der" }),
    );
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hello")),
    );

    const k = publicKey.asymmetricKeyDetails!.modulusLength! / 8;
    const em = Buffer.alloc(k, 0xff);
    em[0] = 0x00;
    em[1] = 0x01;
    em[k - hash.length - 1] = 0x00;
    Buffer.from(hash).copy(em, k - hash.length);

    const jwk = privateKey.export({ format: "jwk" });
    const n = b64urlToBigInt(jwk.n!);
    const d = b64urlToBigInt(jwk.d!);
    const m = BigInt("0x" + em.toString("hex"));
    const s = modPow(m, d, n);
    let sigHex = s.toString(16);
    if (sigHex.length % 2) sigHex = "0" + sigHex;
    const sig = Buffer.from(sigHex.padStart(k * 2, "0"), "hex");

    await RsaWasm.initBundled();
    const pub = RsaPublicKey.from_public_key_der(new Memory(spki));
    expect(
      pub.verify_pkcs1v15_unprefixed(new Memory(hash), new Memory(sig)),
    ).toBe(true);

    const bad = hash.slice();
    bad[0] ^= 1;
    expect(
      pub.verify_pkcs1v15_unprefixed(new Memory(bad), new Memory(sig)),
    ).toBe(false);
  });
});
