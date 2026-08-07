'use strict';

var bytes = require('@hazae41/bytes');
var cascade = require('@hazae41/cascade');
var future = require('@hazae41/future');
var reader = require('./reader.cjs');
var writer = require('./writer.cjs');

var _a;
class TurboDuplex {
    params;
    #secret;
    constructor(params = {}) {
        this.params = params;
        this.#secret = new SecretTurboDuplex(params);
    }
    [Symbol.dispose]() {
        this.close();
    }
    get client() {
        return this.#secret.client;
    }
    get inner() {
        return this.#secret.inner;
    }
    get outer() {
        return this.#secret.outer;
    }
    get closing() {
        return this.#secret.closing;
    }
    get closed() {
        return this.#secret.closed;
    }
    error(reason) {
        this.#secret.error(reason);
    }
    close() {
        this.#secret.close();
    }
}
class SecretTurboDuplex {
    params;
    #class = _a;
    static token = new Uint8Array([0x12, 0x93, 0x60, 0x5d, 0x27, 0x81, 0x75, 0xf5]);
    duplex;
    reader;
    writer;
    client;
    resolveOnStart = new future.Future();
    constructor(params = {}) {
        this.params = params;
        const { client = bytes.Bytes.random(8) } = params;
        this.client = client;
        this.reader = new reader.SecretTurboReader(this);
        this.writer = new writer.SecretTurboWriter(this);
        this.duplex = new cascade.FullDuplex({
            input: {
                write: c => this.reader.onWrite(c),
            },
            output: {
                start: () => this.writer.onStart(),
                write: c => this.writer.onWrite(c),
            },
            error: e => this.params.error?.call(undefined, e),
            close: () => this.params.close?.call(undefined),
        });
        this.resolveOnStart.resolve();
    }
    get class() {
        return this.#class;
    }
    [Symbol.dispose]() {
        this.close();
    }
    get inner() {
        return this.duplex.inner;
    }
    get outer() {
        return this.duplex.outer;
    }
    get input() {
        return this.duplex.input;
    }
    get output() {
        return this.duplex.output;
    }
    get closing() {
        return this.duplex.closing;
    }
    get closed() {
        return this.duplex.closed;
    }
    error(reason) {
        this.duplex.error(reason);
    }
    close() {
        this.duplex.close();
    }
}
_a = SecretTurboDuplex;

exports.SecretTurboDuplex = SecretTurboDuplex;
exports.TurboDuplex = TurboDuplex;
//# sourceMappingURL=stream.cjs.map
