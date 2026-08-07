/**
 * Drop-in replacement for `@hazae41/aes.wasm` using @noble/ciphers.
 * Same surface: Memory, Aes128Ctr128BEKey, AesWasm.initBundled().
 */
import { ctr } from "@noble/ciphers/aes.js"

export class Memory {
  readonly #bytes: Uint8Array

  constructor(inner: Uint8Array) {
    this.#bytes = inner
  }

  [Symbol.dispose]() { }

  ptr(): number {
    return 0
  }

  len(): number {
    return this.#bytes.length
  }

  get bytes(): Uint8Array {
    return this.#bytes
  }
}

function incrementBe(counter: Uint8Array) {
  for (let i = counter.length - 1; i >= 0; i--) {
    counter[i] = (counter[i]! + 1) & 0xff
    if (counter[i] !== 0) break
  }
}

export class Aes128Ctr128BEKey {
  readonly #key: Uint8Array
  readonly #nonce: Uint8Array

  constructor(key: Memory, iv: Memory) {
    this.#key = key.bytes.slice()
    this.#nonce = iv.bytes.slice()
  }

  [Symbol.dispose]() { }

  apply_keystream(memory: Memory): void {
    const bytes = memory.bytes
    if (bytes.length === 0) return
    const out = ctr(this.#key, this.#nonce).encrypt(bytes.slice())
    bytes.set(out)
    const blocks = Math.ceil(bytes.length / 16)
    for (let i = 0; i < blocks; i++) incrementBe(this.#nonce)
  }
}

export const AesWasm = {
  Memory,
  async initBundled() { },
}
