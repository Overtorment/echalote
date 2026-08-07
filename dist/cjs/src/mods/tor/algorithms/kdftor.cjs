'use strict';

var cursor = require('@hazae41/cursor');
var constants = require('../constants.cjs');

var _a;
class InvalidKdfKeyHashError extends Error {
    #class = _a;
    name = this.#class.name;
    constructor() {
        super(`Invalid KDF key hash`);
    }
}
_a = InvalidKdfKeyHashError;
exports.KDFTorResult = void 0;
(function (KDFTorResult) {
    async function computeOrThrow(k0) {
        const ki = new cursor.Cursor(new Uint8Array(k0.length + 1));
        ki.writeOrThrow(k0);
        const k = new cursor.Cursor(new Uint8Array(constants.HASH_LEN * 5));
        for (let i = 0; k.remaining > 0; i++) {
            ki.setUint8OrThrow(i);
            const h = new Uint8Array(await crypto.subtle.digest("SHA-1", ki.bytes));
            k.writeOrThrow(h);
        }
        k.offset = 0;
        const keyHash = k.readAndCopyOrThrow(constants.HASH_LEN);
        const forwardDigest = k.readAndCopyOrThrow(constants.HASH_LEN);
        const backwardDigest = k.readAndCopyOrThrow(constants.HASH_LEN);
        const forwardKey = k.readAndCopyOrThrow(constants.KEY_LEN);
        const backwardKey = k.readAndCopyOrThrow(constants.KEY_LEN);
        return { keyHash, forwardDigest, backwardDigest, forwardKey, backwardKey };
    }
    KDFTorResult.computeOrThrow = computeOrThrow;
})(exports.KDFTorResult || (exports.KDFTorResult = {}));

exports.InvalidKdfKeyHashError = InvalidKdfKeyHashError;
//# sourceMappingURL=kdftor.cjs.map
