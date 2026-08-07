'use strict';

var bytes = require('@hazae41/bytes');
var cursor = require('@hazae41/cursor');
var constants = require('../../constants.cjs');

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
exports.NtorResult = void 0;
(function (NtorResult) {
    async function finalizeOrThrow(shared_xy, shared_xb, relayid_rsa, public_b, public_x, public_y) {
        const protoid = "ntor-curve25519-sha256-1";
        const secret_input = new cursor.Cursor(new Uint8Array(32 + 32 + 20 + 32 + 32 + 32 + protoid.length));
        secret_input.writeOrThrow(shared_xy);
        secret_input.writeOrThrow(shared_xb);
        secret_input.writeOrThrow(relayid_rsa);
        secret_input.writeOrThrow(public_b);
        secret_input.writeOrThrow(public_x);
        secret_input.writeOrThrow(public_y);
        secret_input.writeUtf8OrThrow(protoid);
        const t_mac = bytes.Bytes.fromUtf8(`${protoid}:mac`);
        const t_key = bytes.Bytes.fromUtf8(`${protoid}:key_extract`);
        const t_verify = bytes.Bytes.fromUtf8(`${protoid}:verify`);
        const kt_verify = await crypto.subtle.importKey("raw", t_verify, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const verify = new Uint8Array(await crypto.subtle.sign("HMAC", kt_verify, secret_input.bytes));
        const server = "Server";
        const auth_input = new cursor.Cursor(new Uint8Array(32 + 20 + 32 + 32 + 32 + protoid.length + server.length));
        auth_input.writeOrThrow(verify);
        auth_input.writeOrThrow(relayid_rsa);
        auth_input.writeOrThrow(public_b);
        auth_input.writeOrThrow(public_y);
        auth_input.writeOrThrow(public_x);
        auth_input.writeUtf8OrThrow(protoid);
        auth_input.writeUtf8OrThrow(server);
        const t_mac_key = await crypto.subtle.importKey("raw", t_mac, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const auth = new Uint8Array(await crypto.subtle.sign("HMAC", t_mac_key, auth_input.bytes));
        const m_expand = bytes.Bytes.fromUtf8(`${protoid}:key_expand`);
        const secret_input_key = await crypto.subtle.importKey("raw", secret_input.bytes, "HKDF", false, ["deriveBits"]);
        const key_params = { name: "HKDF", hash: "SHA-256", info: m_expand, salt: t_key };
        const key_bytes = new Uint8Array(await crypto.subtle.deriveBits(key_params, secret_input_key, 8 * ((constants.HASH_LEN * 3) + (constants.KEY_LEN * 2))));
        const key = new cursor.Cursor(key_bytes);
        const forwardDigest = key.readAndCopyOrThrow(constants.HASH_LEN);
        const backwardDigest = key.readAndCopyOrThrow(constants.HASH_LEN);
        const forwardKey = key.readAndCopyOrThrow(constants.KEY_LEN);
        const backwardKey = key.readAndCopyOrThrow(constants.KEY_LEN);
        const nonce = key.readAndCopyOrThrow(constants.HASH_LEN);
        return { forwardDigest, backwardDigest, forwardKey, backwardKey, auth, nonce };
    }
    NtorResult.finalizeOrThrow = finalizeOrThrow;
})(exports.NtorResult || (exports.NtorResult = {}));

exports.InvalidNtorAuthError = InvalidNtorAuthError;
exports.NtorRequest = NtorRequest;
exports.NtorResponse = NtorResponse;
//# sourceMappingURL=ntor.cjs.map
