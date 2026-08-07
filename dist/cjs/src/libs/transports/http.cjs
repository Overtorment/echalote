'use strict';

var binary = require('@hazae41/binary');
var cascade = require('@hazae41/cascade');
var cursor = require('@hazae41/cursor');
var resizer = require('../resizer/resizer.cjs');

class BatchedFetchStream {
    request;
    duplex;
    #buffer = new resizer.Resizer();
    constructor(request) {
        this.request = request;
        this.duplex = new cascade.FullDuplex({
            output: {
                write: c => this.#buffer.writeFromOrThrow(c),
            }
        });
        this.loop();
    }
    async loop() {
        while (!this.duplex.closed) {
            try {
                const body = this.#buffer.inner.before;
                this.#buffer.inner.offset = 0;
                const res = await fetch(this.request, { method: "POST", body });
                const data = new Uint8Array(await res.arrayBuffer());
                const chunker = new cursor.Cursor(data);
                for (const chunk of chunker.splitOrThrow(16384))
                    this.duplex.input.enqueue(new binary.Opaque(chunk));
                continue;
            }
            catch (e) {
                this.duplex.error(e);
                break;
            }
        }
    }
}

exports.BatchedFetchStream = BatchedFetchStream;
//# sourceMappingURL=http.cjs.map
