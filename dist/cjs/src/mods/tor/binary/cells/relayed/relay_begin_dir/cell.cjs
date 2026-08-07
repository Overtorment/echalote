'use strict';

var _a;
class RelayBeginDirCell {
    #class = _a;
    static early = false;
    static stream = true;
    static rcommand = 13;
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
        cursor.fillOrThrow(0, cursor.remaining);
    }
}
_a = RelayBeginDirCell;

exports.RelayBeginDirCell = RelayBeginDirCell;
//# sourceMappingURL=cell.cjs.map
