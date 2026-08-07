'use strict';

var _a;
class SignedWithEd25519Key {
    key;
    #class = _a;
    static type = 4;
    constructor(key) {
        this.key = key;
    }
    get type() {
        return this.#class.type;
    }
    static readOrThrow(cursor) {
        return new _a(cursor.readAndCopyOrThrow(32));
    }
}
_a = SignedWithEd25519Key;

exports.SignedWithEd25519Key = SignedWithEd25519Key;
//# sourceMappingURL=signer.cjs.map
