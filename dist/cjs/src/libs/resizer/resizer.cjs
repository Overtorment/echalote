'use strict';

var cursor = require('@hazae41/cursor');

class Resizer {
    minimum;
    maximum;
    inner;
    constructor(minimum = 2 ** 10, maximum = 2 ** 20) {
        this.minimum = minimum;
        this.maximum = maximum;
        this.inner = new cursor.Cursor(new Uint8Array(this.minimum));
    }
    writeOrThrow(chunk) {
        const length = this.inner.offset + chunk.length;
        if (length > this.maximum)
            throw new Error(`Maximum size exceeded`);
        if (length > this.inner.length) {
            const resized = new cursor.Cursor(new Uint8Array(length));
            resized.writeOrThrow(this.inner.before);
            this.inner = resized;
        }
        this.inner.writeOrThrow(chunk);
    }
    writeFromOrThrow(writable) {
        const length = this.inner.offset + writable.sizeOrThrow();
        if (length > this.maximum)
            throw new Error(`Maximum size exceeded`);
        if (length > this.inner.length) {
            const resized = new cursor.Cursor(new Uint8Array(length));
            resized.writeOrThrow(this.inner.before);
            this.inner = resized;
        }
        writable.writeOrThrow(this.inner);
    }
}

exports.Resizer = Resizer;
//# sourceMappingURL=resizer.cjs.map
