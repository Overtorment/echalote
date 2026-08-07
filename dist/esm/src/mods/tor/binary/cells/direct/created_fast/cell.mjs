var _a;
class CreatedFastCell {
    material;
    derivative;
    #class = _a;
    static old = false;
    static circuit = true;
    static command = 6;
    constructor(material, derivative) {
        this.material = material;
        this.derivative = derivative;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        return this.material.length + this.derivative.length;
    }
    writeOrThrow(cursor) {
        cursor.writeOrThrow(this.material);
        cursor.writeOrThrow(this.derivative);
    }
    static readOrThrow(cursor) {
        const material = cursor.readAndCopyOrThrow(20);
        const derivative = cursor.readAndCopyOrThrow(20);
        cursor.offset += cursor.remaining;
        return new _a(material, derivative);
    }
}
_a = CreatedFastCell;

export { CreatedFastCell };
//# sourceMappingURL=cell.mjs.map
