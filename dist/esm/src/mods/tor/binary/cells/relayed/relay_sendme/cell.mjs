import { Opaque } from '@hazae41/binary';

var _a, _b;
class RelaySendmeCircuitCell {
    version;
    fragment;
    #class = _a;
    static early = false;
    static stream = false;
    static rcommand = 5;
    static versions = {
        0: 0,
        1: 1
    };
    constructor(version, fragment) {
        this.version = version;
        this.fragment = fragment;
    }
    get early() {
        return this.#class.early;
    }
    get stream() {
        return this.#class.stream;
    }
    get rcommand() {
        return this.#class.rcommand;
    }
    sizeOrThrow() {
        return 1 + 2 + this.fragment.sizeOrThrow();
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.version);
        const size = this.fragment.sizeOrThrow();
        cursor.writeUint16OrThrow(size);
        this.fragment.writeOrThrow(cursor);
    }
    static readOrThrow(cursor) {
        const version = cursor.readUint8OrThrow();
        const length = cursor.readUint16OrThrow();
        const bytes = cursor.readAndCopyOrThrow(length);
        const data = new Opaque(bytes);
        return new _a(version, data);
    }
}
_a = RelaySendmeCircuitCell;
class RelaySendmeStreamCell {
    #class = _b;
    static early = false;
    static stream = true;
    static rcommand = 5;
    static versions = {
        0: 0,
        1: 1
    };
    constructor() { }
    get early() {
        return this.#class.early;
    }
    get stream() {
        return this.#class.stream;
    }
    get rcommand() {
        return this.#class.rcommand;
    }
    sizeOrThrow() {
        return 0;
    }
    writeOrThrow(cursor) {
        return;
    }
    static readOrThrow(cursor) {
        return new _b();
    }
}
_b = RelaySendmeStreamCell;
class RelaySendmeDigest {
    digest;
    constructor(digest) {
        this.digest = digest;
    }
    sizeOrThrow() {
        return this.digest.length;
    }
    writeOrThrow(cursor) {
        cursor.writeOrThrow(this.digest);
    }
    static readOrThrow(cursor) {
        return new RelaySendmeDigest(cursor.readAndCopyOrThrow(20));
    }
}

export { RelaySendmeCircuitCell, RelaySendmeDigest, RelaySendmeStreamCell };
//# sourceMappingURL=cell.mjs.map
