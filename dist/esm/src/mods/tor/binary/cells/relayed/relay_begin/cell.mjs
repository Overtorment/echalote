import { Bytes } from '@hazae41/bytes';

var _a;
class RelayBeginCell {
    address;
    bytes;
    flags;
    #class = _a;
    static early = false;
    static stream = true;
    static rcommand = 1;
    static flags = {
        IPV6_OK: 0,
        IPV4_NOT_OK: 1,
        IPV6_PREFER: 2
    };
    constructor(address, bytes, flags) {
        this.address = address;
        this.bytes = bytes;
        this.flags = flags;
    }
    static create(address, flags) {
        return new _a(address, Bytes.fromUtf8(address), flags);
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
        return (this.bytes.length + 1) + 4;
    }
    writeOrThrow(cursor) {
        cursor.writeNulledOrThrow(this.bytes);
        cursor.writeUint32OrThrow(this.flags);
    }
    static readOrThrow(cursor) {
        const bytes = cursor.readNulledAndCopyOrThrow();
        const address = Bytes.toUtf8(bytes);
        const flags = cursor.readUint32OrThrow();
        return new _a(address, bytes, flags);
    }
}
_a = RelayBeginCell;

export { RelayBeginCell };
//# sourceMappingURL=cell.mjs.map
