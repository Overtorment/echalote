import { Ed25519 } from "@hazae41/ed25519"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import * as nobleEd from "@noble/curves/ed25519"
import { sha1 as nobleSha1 } from "@noble/hashes/sha1"

let ready: Promise<void> | null = null

/**
 * Install crypto adapters required by TorClientDuplex / circuit ntor.
 * Uses Bun WebCrypto for Ed25519 and Noble for X25519 + SHA-1
 * (Bun's native X25519 rejects valid ntor public keys).
 */
export function initBundledCrypto(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (!Ed25519.get().isSome()) {
        Ed25519.set(await Ed25519.fromNative())
      }
      if (!X25519.get().isSome()) {
        X25519.set(X25519.fromNoble(nobleEd))
      }
      if (!Sha1.get().isSome()) {
        Sha1.set(Sha1.fromNoble({ sha1: nobleSha1 } as never))
      }
    })()
  }
  return ready
}
