import { Opaque } from '@hazae41/binary';
import { Unimplemented } from '../../../../errors.mjs';

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
        throw new Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new Unimplemented();
    }
    static readOrThrow(cursor) {
        const length = cursor.readUint16OrThrow();
        const bytes = cursor.readAndCopyOrThrow(length);
        const data = new Opaque(bytes);
        return new _a(data);
    }
}
_a = RelayExtended2Cell;

export { RelayExtended2Cell };
//# sourceMappingURL=cell.mjs.map
