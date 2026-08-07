'use strict';

var errors = require('../../../../errors.cjs');

var _a;
class PaddingCell {
    data;
    #class = _a;
    static circuit = false;
    static command = 0;
    constructor(data) {
        this.data = data;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        throw new errors.Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new errors.Unimplemented();
    }
    static readOrThrow(cursor) {
        return new _a(cursor.readAndCopyOrThrow(cursor.remaining));
    }
}
_a = PaddingCell;

exports.PaddingCell = PaddingCell;
//# sourceMappingURL=cell.cjs.map
