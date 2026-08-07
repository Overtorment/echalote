var _a;
class CreateFastCell {
    material;
    #class = _a;
    static old = false;
    static circuit = true;
    static command = 5;
    /**
     * The CREATE_FAST cell
     * @param material Key material (X) [20]
     */
    constructor(material) {
        this.material = material;
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
        return this.material.length;
    }
    writeOrThrow(cursor) {
        cursor.writeOrThrow(this.material);
    }
    static readOrThrow(cursor) {
        const material = cursor.readAndCopyOrThrow(20);
        cursor.offset += cursor.remaining;
        return new _a(material);
    }
}
_a = CreateFastCell;

export { CreateFastCell };
//# sourceMappingURL=cell.mjs.map
