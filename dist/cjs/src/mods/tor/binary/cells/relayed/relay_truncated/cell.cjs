'use strict';

var cell = require('../../direct/destroy/cell.cjs');

var _a;
class RelayTruncatedCell {
    reason;
    #class = _a;
    static early = false;
    static stream = false;
    static rcommand = 9;
    static reasons = cell.DestroyCell.reasons;
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
_a = RelayTruncatedCell;

exports.RelayTruncatedCell = RelayTruncatedCell;
//# sourceMappingURL=cell.cjs.map
