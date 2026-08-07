/**
 * Install crypto adapters required by TorClientDuplex / circuit ntor.
 * Uses Bun WebCrypto for Ed25519 and Noble for X25519 + SHA-1
 * (Bun's native X25519 rejects valid ntor public keys).
 */
declare function initBundledCrypto(): Promise<void>;

export { initBundledCrypto };
