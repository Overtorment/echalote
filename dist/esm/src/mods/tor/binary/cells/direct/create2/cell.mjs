var _a;
class Create2Cell {
    type;
    data;
    #class = _a;
    static circuit = true;
    static command = 10;
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
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        return 2 + 2 + this.data.length;
    }
    writeOrThrow(cursor) {
        cursor.writeUint16OrThrow(this.type);
        cursor.writeUint16OrThrow(this.data.length);
        cursor.writeOrThrow(this.data);
    }
    static readOrThrow(cursor) {
        const type = cursor.readUint16OrThrow();
        const length = cursor.readUint16OrThrow();
        const data = cursor.readAndCopyOrThrow(length);
        cursor.offset += cursor.remaining;
        return new _a(type, data);
    }
}
_a = Create2Cell;

export { Create2Cell };
//# sourceMappingURL=cell.mjs.map
