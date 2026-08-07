'use strict';

var binary = require('@hazae41/binary');
var errors = require('../../../../errors.cjs');

var _a;
class RelayExtended2Cell {
    fragment;
    #class = _a;
    static early = false;
    static stream = false;
    static rcommand = 15;
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
        throw new errors.Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new errors.Unimplemented();
    }
    static readOrThrow(cursor) {
        const length = cursor.readUint16OrThrow();
        const bytes = cursor.readAndCopyOrThrow(length);
        const data = new binary.Opaque(bytes);
        return new _a(data);
    }
}
_a = RelayExtended2Cell;

exports.RelayExtended2Cell = RelayExtended2Cell;
//# sourceMappingURL=cell.cjs.map
