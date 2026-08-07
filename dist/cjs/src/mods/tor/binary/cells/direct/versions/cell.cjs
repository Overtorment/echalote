'use strict';

var _a;
class VersionsCell {
    versions;
    #class = _a;
    static old = true;
    static circuit = false;
    static command = 7;
    constructor(versions) {
        this.versions = versions;
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
        return 2 * this.versions.length;
    }
    writeOrThrow(cursor) {
        for (const version of this.versions)
            cursor.writeUint16OrThrow(version);
        return;
    }
    static readOrThrow(cursor) {
        const versions = new Array(cursor.remaining / 2);
        for (let i = 0; i < versions.length; i++)
            versions[i] = cursor.readUint16OrThrow();
        return new _a(versions);
    }
}
_a = VersionsCell;

exports.VersionsCell = VersionsCell;
//# sourceMappingURL=cell.cjs.map
