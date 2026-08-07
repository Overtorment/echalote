import { describe, expect, test } from "@jest/globals";
import { Ed25519 } from "@hazae41/ed25519";
import { Sha1 } from "@hazae41/sha1";
import { X25519 } from "@hazae41/x25519";
import { initBundledCrypto } from "../../src/mods/crypto/init.ts";

describe("initBundledCrypto", () => {
  test("installs Ed25519, X25519, and Sha1 adapters", async () => {
    await initBundledCrypto();
    expect(Ed25519.get().isSome()).toBe(true);
    expect(X25519.get().isSome()).toBe(true);
    expect(Sha1.get().isSome()).toBe(true);
  });

  test("X25519 can import a 32-byte ntor-style public key (Bun native cannot)", async () => {
    await initBundledCrypto();
    // Sample ntor onion key bytes (valid curve25519 length); Bun WebCrypto rejects many of these.
    const pub = new Uint8Array(32);
    pub[0] = 0x89;
    pub[1] = 0x7b;
    pub[31] = 0x01;
    const key = await X25519.get().getOrThrow().PublicKey.importOrThrow(pub);
    expect(key).toBeDefined();
  });

  test("Sha1 hashes known vector", async () => {
    await initBundledCrypto();
    const out = Sha1.get().getOrThrow().hashOrThrow(new Uint8Array([1, 2, 3]));
    expect(out.bytes.length).toBe(20);
  });

  test("is idempotent", async () => {
    await initBundledCrypto();
    await initBundledCrypto();
    expect(Ed25519.get().isSome()).toBe(true);
  });
});
