'use strict';

var binary = require('@hazae41/binary');
var bitset = require('@hazae41/bitset');

var _a, _b;
class FragmentOverflowError extends Error {
    #class = _a;
    name = this.#class.name;
    constructor() {
        super(`Fragment size is greater than or equals to 2**20`);
    }
}
_a = FragmentOverflowError;
class UnexpectedContinuationError extends Error {
    #class = _b;
    name = this.#class.name;
    constructor() {
        super(`Unexpected continuation bit on third byte`);
    }
}
_b = UnexpectedContinuationError;
class TurboFrame {
    padding;
    fragment;
    fragmentSize;
    constructor(padding, fragment, fragmentSize) {
        this.padding = padding;
        this.fragment = fragment;
        this.fragmentSize = fragmentSize;
    }
    static createOrThrow(params) {
        const { padding, fragment } = params;
        const fragmentSize = fragment.sizeOrThrow();
        if (fragmentSize >= (2 ** 20))
            throw new FragmentOverflowError();
        return new TurboFrame(padding, fragment, fragmentSize);
    }
    sizeOrThrow() {
        if (this.fragmentSize < (2 ** 6))
            return 1 + this.fragmentSize;
        if (this.fragmentSize < (2 ** 13))
            return 2 + this.fragmentSize;
        if (this.fragmentSize < (2 ** 20))
            return 3 + this.fragmentSize;
        throw new FragmentOverflowError();
    }
    writeOrThrow(cursor) {
        if (this.fragmentSize < (2 ** 6))
            return this.writeOrThrow6(cursor, this.fragmentSize);
        if (this.fragmentSize < (2 ** 13))
            return this.writeOrThrow13(cursor, this.fragmentSize);
        if (this.fragmentSize < (2 ** 20))
            return this.writeOrThrow20(cursor, this.fragmentSize);
        throw new FragmentOverflowError();
    }
    writeOrThrow6(cursor, size) {
        const first = new bitset.Bitset(size, 8);
        first.setBE(0, !this.padding);
        first.setBE(1, false);
        first.unsign();
        cursor.writeUint8OrThrow(first.value);
        this.fragment.writeOrThrow(cursor);
    }
    writeOrThrow13(cursor, size) {
        let bits = "";
        bits += this.padding ? "0" : "1";
        bits += "1";
        const length = size.toString(2).padStart(13, "0");
        bits += length.slice(0, 6);
        bits += "0";
        bits += length.slice(6, 13);
        cursor.writeUint16OrThrow(parseInt(bits, 2));
        this.fragment.writeOrThrow(cursor);
    }
    writeOrThrow20(cursor, size) {
        let bits = "";
        bits += this.padding ? "0" : "1";
        bits += "1";
        const length = size.toString(2).padStart(20, "0");
        bits += length.slice(0, 6);
        bits += "1";
        bits += length.slice(6, 13);
        bits += "0";
        bits += length.slice(13, 20);
        cursor.writeUint24OrThrow(parseInt(bits, 2));
        this.fragment.writeOrThrow(cursor);
    }
    /**
     * Read from bytes
     * @param binary bytes
     */
    static readOrThrow(cursor) {
        let lengthBits = "";
        const first = cursor.readUint8OrThrow();
        const bits = new bitset.Bitset(first, 8);
        const padding = !bits.getBE(0);
        const continuation = bits.getBE(1);
        lengthBits += bits.last(6).toString();
        if (continuation) {
            const second = cursor.readUint8OrThrow();
            const bits2 = new bitset.Bitset(second, 8);
            const continuation2 = bits2.getBE(0);
            lengthBits += bits2.last(7).toString();
            if (continuation2) {
                const third = cursor.readUint8OrThrow();
                const bits3 = new bitset.Bitset(third, 8);
                const continuation3 = bits3.getBE(0);
                lengthBits += bits3.last(7).toString();
                if (continuation3)
                    throw new UnexpectedContinuationError();
            }
        }
        const length = parseInt(lengthBits, 2);
        const bytes = cursor.readAndCopyOrThrow(length);
        const fragment = new binary.Opaque(bytes);
        return TurboFrame.createOrThrow({ padding, fragment });
    }
}

exports.FragmentOverflowError = FragmentOverflowError;
exports.TurboFrame = TurboFrame;
exports.UnexpectedContinuationError = UnexpectedContinuationError;
//# sourceMappingURL=frame.cjs.map
