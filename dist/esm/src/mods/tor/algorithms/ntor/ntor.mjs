import { Bytes } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';
import { HASH_LEN, KEY_LEN } from '../../constants.mjs';

var _a;
class InvalidNtorAuthError extends Error {
    #class = _a;
    name = this.#class.name;
    constructor() {
        super(`Invalid Ntor auth`);
    }
}
_a = InvalidNtorAuthError;
class NtorResponse {
    public_y;
    auth;
    constructor(public_y, auth) {
        this.public_y = public_y;
        this.auth = auth;
    }
    static readOrThrow(cursor) {
        const publicY = cursor.readAndCopyOrThrow(32);
        const auth = cursor.readAndCopyOrThrow(32);
        return new NtorResponse(publicY, auth);
    }
}
class NtorRequest {
    public_x;
    relayid_rsa;
    ntor_onion_key;
    constructor(public_x, relayid_rsa, ntor_onion_key) {
        this.public_x = public_x;
        this.relayid_rsa = relayid_rsa;
        this.ntor_onion_key = ntor_onion_key;
    }
    sizeOrThrow() {
        return 0
            + this.relayid_rsa.length
            + this.ntor_onion_key.length
            + this.public_x.length;
    }
    writeOrThrow(cursor) {
        cursor.writeOrThrow(this.relayid_rsa);
        cursor.writeOrThrow(this.ntor_onion_key);
        cursor.writeOrThrow(this.public_x);
    }
}
var NtorResult;
(function (NtorResult) {
    async function finalizeOrThrow(shared_xy, shared_xb, relayid_rsa, public_b, public_x, public_y) {
        const protoid = "ntor-curve25519-sha256-1";
        const secret_input = new Cursor(new Uint8Array(32 + 32 + 20 + 32 + 32 + 32 + protoid.length));
        secret_input.writeOrThrow(shared_xy);
        secret_input.writeOrThrow(shared_xb);
        secret_input.writeOrThrow(relayid_rsa);
        secret_input.writeOrThrow(public_b);
        secret_input.writeOrThrow(public_x);
        secret_input.writeOrThrow(public_y);
        secret_input.writeUtf8OrThrow(protoid);
        const t_mac = Bytes.fromUtf8(`${protoid}:mac`);
        const t_key = Bytes.fromUtf8(`${protoid}:key_extract`);
        const t_verify = Bytes.fromUtf8(`${protoid}:verify`);
        const kt_verify = await crypto.subtle.importKey("raw", t_verify, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const verify = new Uint8Array(await crypto.subtle.sign("HMAC", kt_verify, secret_input.bytes));
        const server = "Server";
        const auth_input = new Cursor(new Uint8Array(32 + 20 + 32 + 32 + 32 + protoid.length + server.length));
        auth_input.writeOrThrow(verify);
        auth_input.writeOrThrow(relayid_rsa);
        auth_input.writeOrThrow(public_b);
        auth_input.writeOrThrow(public_y);
        auth_input.writeOrThrow(public_x);
        auth_input.writeUtf8OrThrow(protoid);
        auth_input.writeUtf8OrThrow(server);
        const t_mac_key = await crypto.subtle.importKey("raw", t_mac, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const auth = new Uint8Array(await crypto.subtle.sign("HMAC", t_mac_key, auth_input.bytes));
        const m_expand = Bytes.fromUtf8(`${protoid}:key_expand`);
        const secret_input_key = await crypto.subtle.importKey("raw", secret_input.bytes, "HKDF", false, ["deriveBits"]);
        const key_params = { name: "HKDF", hash: "SHA-256", info: m_expand, salt: t_key };
        const key_bytes = new Uint8Array(await crypto.subtle.deriveBits(key_params, secret_input_key, 8 * ((HASH_LEN * 3) + (KEY_LEN * 2))));
        const key = new Cursor(key_bytes);
        const forwardDigest = key.readAndCopyOrThrow(HASH_LEN);
        const backwardDigest = key.readAndCopyOrThrow(HASH_LEN);
        const forwardKey = key.readAndCopyOrThrow(KEY_LEN);
        const backwardKey = key.readAndCopyOrThrow(KEY_LEN);
        const nonce = key.readAndCopyOrThrow(HASH_LEN);
        return { forwardDigest, backwardDigest, forwardKey, backwardKey, auth, nonce };
    }
    NtorResult.finalizeOrThrow = finalizeOrThrow;
})(NtorResult || (NtorResult = {}));

export { InvalidNtorAuthError, NtorRequest, NtorResponse, NtorResult };
//# sourceMappingURL=ntor.mjs.map
