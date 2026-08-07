'use strict';

var binary = require('@hazae41/binary');
var frame = require('./frame.cjs');

class SecretTurboWriter {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    async onStart() {
        await this.parent.resolveOnStart.promise;
        const token = this.parent.class.token;
        this.parent.output.enqueue(new binary.Opaque(token));
        const client = this.parent.client;
        this.parent.output.enqueue(new binary.Opaque(client));
    }
    async onWrite(fragment) {
        const frame$1 = frame.TurboFrame.createOrThrow({ padding: false, fragment });
        this.parent.output.enqueue(frame$1);
    }
}

exports.SecretTurboWriter = SecretTurboWriter;
//# sourceMappingURL=writer.cjs.map
