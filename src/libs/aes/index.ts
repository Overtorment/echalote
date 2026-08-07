/**
 * Drop-in replacement for `@hazae41/aes.wasm` using @noble/ciphers.
 * Same surface: Memory, Aes128Ctr128BEKey, AesWasm.initBundled().
 *
 * Counter mode keeps a mid-block keystream offset — required for Tor relay
 * cells (509-byte payloads are not a multiple of 16).
 */
import { unsafe } from "@noble/ciphers/aes.js"

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
  readonly #xk: ReturnType<typeof unsafe.expandKeyLE>
  readonly #counter: Uint8Array
  readonly #keystream = new Uint8Array(16)
  #offset = 16

  constructor(key: Memory, iv: Memory) {
    this.#xk = unsafe.expandKeyLE(key.bytes.slice())
    this.#counter = iv.bytes.slice()
  }

  [Symbol.dispose]() { }

  apply_keystream(memory: Memory): void {
    const bytes = memory.bytes
    let i = 0
    while (i < bytes.length) {
      if (this.#offset >= 16) {
        this.#keystream.set(this.#counter)
        unsafe.encryptBlock(this.#xk, this.#keystream)
        incrementBe(this.#counter)
        this.#offset = 0
      }
      const n = Math.min(16 - this.#offset, bytes.length - i)
      for (let j = 0; j < n; j++)
        bytes[i + j]! ^= this.#keystream[this.#offset + j]!
      i += n
      this.#offset += n
    }
  }
}

export const AesWasm = {
  Memory,
  async initBundled() { },
}
