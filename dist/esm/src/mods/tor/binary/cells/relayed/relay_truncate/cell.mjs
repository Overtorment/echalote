import { DestroyCell } from '../../direct/destroy/cell.mjs';

var _a;
class RelayTruncateCell {
    reason;
    #class = _a;
    static early = false;
    static stream = false;
    static rcommand = 8;
    static reasons = DestroyCell.reasons;
    constructor(reason) {
        this.reason = reason;
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
        return 1;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.reason);
    }
    static readOrThrow(cursor) {
        return new _a(cursor.readUint8OrThrow());
    }
}
_a = RelayTruncateCell;

export { RelayTruncateCell };
//# sourceMappingURL=cell.mjs.map
