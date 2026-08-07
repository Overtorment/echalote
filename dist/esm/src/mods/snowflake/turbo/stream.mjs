import { Bytes } from '@hazae41/bytes';
import { FullDuplex } from '@hazae41/cascade';
import { Future } from '@hazae41/future';
import { SecretTurboReader } from './reader.mjs';
import { SecretTurboWriter } from './writer.mjs';

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
    resolveOnStart = new Future();
    constructor(params = {}) {
        this.params = params;
        const { client = Bytes.random(8) } = params;
        this.client = client;
        this.reader = new SecretTurboReader(this);
        this.writer = new SecretTurboWriter(this);
        this.duplex = new FullDuplex({
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

export { SecretTurboDuplex, TurboDuplex };
//# sourceMappingURL=stream.mjs.map
