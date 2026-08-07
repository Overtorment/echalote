var _a;
class PaddingNegociateCell {
    version;
    pcommand;
    ito_low_ms;
    ito_high_ms;
    #class = _a;
    static old = false;
    static circuit = false;
    static command = 12;
    static versions = {
        ZERO: 0
    };
    static commands = {
        STOP: 1,
        START: 2
    };
    constructor(version, pcommand, ito_low_ms, ito_high_ms) {
        this.version = version;
        this.pcommand = pcommand;
        this.ito_low_ms = ito_low_ms;
        this.ito_high_ms = ito_high_ms;
    }
    get old() {
        return this.#class.old;
    }
    get circuit() {
        return this.#class.circuit;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        return 1 + 1 + 2 + 2;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.version);
        cursor.writeUint8OrThrow(this.pcommand);
        cursor.writeUint16OrThrow(this.ito_low_ms);
        cursor.writeUint16OrThrow(this.ito_high_ms);
    }
    static readOrThrow(cursor) {
        const version = cursor.readUint8OrThrow();
        const pcommand = cursor.readUint8OrThrow();
        const ito_low_ms = cursor.readUint16OrThrow();
        const ito_high_ms = cursor.readUint16OrThrow();
        cursor.offset += cursor.remaining;
        return new _a(version, pcommand, ito_low_ms, ito_high_ms);
    }
}
_a = PaddingNegociateCell;

export { PaddingNegociateCell };
//# sourceMappingURL=cell.mjs.map
