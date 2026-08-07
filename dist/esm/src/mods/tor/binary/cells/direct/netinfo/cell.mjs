import { TypedAddress } from '../../../address.mjs';

var _a;
class NetinfoCell {
    time;
    other;
    owneds;
    #class = _a;
    static old = false;
    static circuit = false;
    static command = 8;
    constructor(time, other, owneds) {
        this.time = time;
        this.other = other;
        this.owneds = owneds;
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
        return 0
            + 4
            + this.other.sizeOrThrow()
            + 1
            + this.owneds.reduce((p, c) => p + c.sizeOrThrow(), 0);
    }
    writeOrThrow(cursor) {
        cursor.writeUint32OrThrow(this.time);
        this.other.writeOrThrow(cursor);
        cursor.writeUint8OrThrow(this.owneds.length);
        for (const owned of this.owneds)
            owned.writeOrThrow(cursor);
        return;
    }
    static readOrThrow(cursor) {
        const time = cursor.readUint32OrThrow();
        const other = TypedAddress.readOrThrow(cursor);
        const owneds = new Array(cursor.readUint8OrThrow());
        for (let i = 0; i < owneds.length; i++)
            owneds[i] = TypedAddress.readOrThrow(cursor);
        cursor.offset += cursor.remaining;
        return new _a(time, other, owneds);
    }
}
_a = NetinfoCell;

export { NetinfoCell };
//# sourceMappingURL=cell.mjs.map
