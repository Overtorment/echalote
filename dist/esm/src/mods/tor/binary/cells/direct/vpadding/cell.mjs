var _a;
class VariablePaddingCell {
    data;
    #class = _a;
    static circuit = false;
    static command = 128;
    constructor(data) {
        this.data = data;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        return this.data.length;
    }
    writeOrThrow(cursor) {
        cursor.writeOrThrow(this.data);
    }
    static readOrThrow(cursor) {
        return new _a(cursor.readAndCopyOrThrow(cursor.remaining));
    }
}
_a = VariablePaddingCell;

export { VariablePaddingCell };
//# sourceMappingURL=cell.mjs.map
