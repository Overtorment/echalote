var _a;
class RelayExtend2Cell {
    type;
    links;
    data;
    #class = _a;
    static early = true;
    static stream = false;
    static rcommand = 14;
    static types = {
        /**
         * The old, slow, and insecure handshake
         * @deprecated
         */
        TAP: 0,
        /**
         * The new, quick, and secure handshake
         */
        NTOR: 2
    };
    constructor(type, links, data) {
        this.type = type;
        this.links = links;
        this.data = data;
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
        return 0
            + 1
            + this.links.reduce((p, c) => p + c.sizeOrThrow(), 0)
            + 2
            + 2
            + this.data.sizeOrThrow();
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.links.length);
        for (const link of this.links)
            link.writeOrThrow(cursor);
        cursor.writeUint16OrThrow(this.type);
        const size = this.data.sizeOrThrow();
        cursor.writeUint16OrThrow(size);
        this.data.writeOrThrow(cursor);
    }
}
_a = RelayExtend2Cell;

export { RelayExtend2Cell };
//# sourceMappingURL=cell.mjs.map
