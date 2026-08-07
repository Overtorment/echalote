'use strict';

var frame = require('./frame.cjs');

class SecretTurboReader {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    async onWrite(chunk) {
        const frame$1 = chunk.readIntoOrThrow(frame.TurboFrame);
        if (frame$1.padding)
            return;
        this.parent.input.enqueue(frame$1.fragment);
    }
}

exports.SecretTurboReader = SecretTurboReader;
//# sourceMappingURL=reader.cjs.map
