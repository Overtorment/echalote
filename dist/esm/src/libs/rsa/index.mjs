import { createPublicKey } from 'node:crypto';

/**
 * Drop-in replacement for `@hazae41/rsa.wasm` public verify path used by Tor.
 * Implements PKCS#1 v1.5 verify of a pre-hashed digest (unprefixed).
 */
class Memory {
    #bytes;
    constructor(inner) {
        this.#bytes = inner;
    }
    [Symbol.dispose]() { }
    ptr() {
        return 0;
    }
    len() {
        return this.#bytes.length;
    }
    get bytes() {
        return this.#bytes;
    }
}
function b64urlToBigInt(s) {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    return BigInt("0x" +
        Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("hex"));
}
function modPow(base, exp, mod) {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
        if (e & 1n)
            result = (result * b) % mod;
        b = (b * b) % mod;
        e >>= 1n;
    }
    return result;
}
function bigIntToFixedBytes(value, len) {
    let hex = value.toString(16);
    if (hex.length % 2)
        hex = "0" + hex;
    const out = Buffer.from(hex.padStart(len * 2, "0"), "hex");
    return new Uint8Array(out);
}
class RsaPublicKey {
    #key;
    #n;
    #e;
    #k;
    constructor(key, n, e, k) {
        this.#key = key;
        this.#n = n;
        this.#e = e;
        this.#k = k;
    }
    [Symbol.dispose]() { }
    static from_public_key_der(input) {
        const key = createPublicKey({
            key: Buffer.from(input.bytes),
            format: "der",
            type: "spki",
        });
        const jwk = key.export({ format: "jwk" });
        const n = b64urlToBigInt(jwk.n);
        const e = b64urlToBigInt(jwk.e);
        const k = Math.ceil(n.toString(16).length / 2);
        return new RsaPublicKey(key, n, e, k);
    }
    static from_pkcs1_der(input) {
        const key = createPublicKey({
            key: Buffer.from(input.bytes),
            format: "der",
            type: "pkcs1",
        });
        const jwk = key.export({ format: "jwk" });
        const n = b64urlToBigInt(jwk.n);
        const e = b64urlToBigInt(jwk.e);
        const k = Math.ceil(n.toString(16).length / 2);
        return new RsaPublicKey(key, n, e, k);
    }
    /**
     * Verify PKCS#1 v1.5 signature over an already-hashed digest (no DigestInfo).
     */
    verify_pkcs1v15_unprefixed(hashed, signature) {
        try {
            if (signature.bytes.length !== this.#k)
                return false;
            const s = BigInt("0x" + Buffer.from(signature.bytes).toString("hex"));
            if (s >= this.#n)
                return false;
            const m = modPow(s, this.#e, this.#n);
            const em = bigIntToFixedBytes(m, this.#k);
            if (em[0] !== 0x00 || em[1] !== 0x01)
                return false;
            let i = 2;
            while (i < em.length && em[i] === 0xff)
                i++;
            if (i < 10 || i >= em.length || em[i] !== 0x00)
                return false;
            const digest = em.subarray(i + 1);
            const want = hashed.bytes;
            if (digest.length !== want.length)
                return false;
            let diff = 0;
            for (let j = 0; j < digest.length; j++)
                diff |= digest[j] ^ want[j];
            return diff === 0;
        }
        catch {
            return false;
        }
    }
}
const RsaWasm = {
    Memory,
    RsaPublicKey,
    async initBundled() { },
};

export { Memory, RsaPublicKey, RsaWasm };
//# sourceMappingURL=index.mjs.map
