import { Unimplemented } from '../../../../errors.mjs';

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
        throw new Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new Unimplemented();
    }
    static readOrThrow(cursor) {
        return new _a(cursor.readAndCopyOrThrow(cursor.remaining));
    }
}
_a = PaddingCell;

export { PaddingCell };
//# sourceMappingURL=cell.mjs.map
