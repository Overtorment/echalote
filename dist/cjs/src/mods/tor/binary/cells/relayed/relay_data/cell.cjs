'use strict';

var binary = require('@hazae41/binary');

var _a;
class RelayDataCell {
    fragment;
    #class = _a;
    static early = false;
    static stream = true;
    static rcommand = 2;
    constructor(fragment) {
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
        return this.fragment.sizeOrThrow();
    }
    writeOrThrow(cursor) {
        this.fragment.writeOrThrow(cursor);
    }
    static readOrThrow(cursor) {
        return new _a(new binary.Opaque(cursor.readAndCopyOrThrow(cursor.remaining)));
    }
}
_a = RelayDataCell;

exports.RelayDataCell = RelayDataCell;
//# sourceMappingURL=cell.cjs.map
