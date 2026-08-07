'use strict';

var tslib_es6 = require('../../../../../../../node_modules/tslib/tslib.es6.cjs');
var index = require('../../../../../../libs/aes/index.cjs');
var binary = require('@hazae41/binary');
var bytes = require('@hazae41/bytes');
var cursor = require('@hazae41/cursor');
var cell = require('../../cell.cjs');
var errors = require('../../errors.cjs');

exports.RelayEarlyCell = void 0;
(function (RelayEarlyCell) {
    RelayEarlyCell.HEAD_LEN = 1 + 2 + 2 + 4 + 2;
    RelayEarlyCell.DATA_LEN = cell.Cell.PAYLOAD_LEN - RelayEarlyCell.HEAD_LEN;
    RelayEarlyCell.command = 9;
    class Raw {
        circuit;
        stream;
        rcommand;
        fragment;
        constructor(circuit, stream, rcommand, fragment) {
            this.circuit = circuit;
            this.stream = stream;
            this.rcommand = rcommand;
            this.fragment = fragment;
        }
        unpackOrThrow() {
            if (this.stream === 0)
                return new Streamless(this.circuit, undefined, this.rcommand, this.fragment);
            const stream = this.circuit.streams.get(this.stream);
            if (stream == null)
                throw new errors.UnknownStreamError();
            return new Streamful(this.circuit, stream, this.rcommand, this.fragment);
        }
        cellOrThrow() {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const cursor$1 = new cursor.Cursor(new Uint8Array(cell.Cell.PAYLOAD_LEN));
                cursor$1.writeUint8OrThrow(this.rcommand);
                cursor$1.writeUint16OrThrow(0);
                cursor$1.writeUint16OrThrow(this.stream);
                const digestOffset = cursor$1.offset;
                cursor$1.writeUint32OrThrow(0);
                const size = this.fragment.sizeOrThrow();
                cursor$1.writeUint16OrThrow(size);
                this.fragment.writeOrThrow(cursor$1);
                cursor$1.fillOrThrow(0, Math.min(cursor$1.remaining, 4));
                cursor$1.writeOrThrow(bytes.Bytes.random(cursor$1.remaining));
                const exit = this.circuit.targets[this.circuit.targets.length - 1];
                exit.forward_digest.updateOrThrow(cursor$1.bytes);
                const digestSlice = tslib_es6.__addDisposableResource(env_1, exit.forward_digest.finalizeOrThrow(), false);
                cursor$1.offset = digestOffset;
                cursor$1.writeOrThrow(digestSlice.bytes.subarray(0, 4));
                const memory = tslib_es6.__addDisposableResource(env_1, new index.AesWasm.Memory(cursor$1.bytes), false);
                for (let i = this.circuit.targets.length - 1; i >= 0; i--)
                    this.circuit.targets[i].forward_key.apply_keystream(memory);
                const fragment = new binary.Opaque(new Uint8Array(memory.bytes));
                return new cell.Cell.Circuitful(this.circuit, RelayEarlyCell.command, fragment);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                tslib_es6.__disposeResources(env_1);
            }
        }
        static uncellOrThrow(cell$1) {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                if (cell$1 instanceof cell.Cell.Circuitless)
                    throw new errors.ExpectedCircuitError();
                const memory = tslib_es6.__addDisposableResource(env_2, new index.AesWasm.Memory(cell$1.fragment.bytes), false);
                for (const target of cell$1.circuit.targets) {
                    const env_3 = { stack: [], error: void 0, hasError: false };
                    try {
                        target.backward_key.apply_keystream(memory);
                        const cursor$1 = new cursor.Cursor(memory.bytes);
                        const rcommand = cursor$1.readUint8OrThrow();
                        const recognised = cursor$1.readUint16OrThrow();
                        if (recognised !== 0)
                            continue;
                        const stream = cursor$1.readUint16OrThrow();
                        const offset = cursor$1.offset;
                        const digest4 = cursor$1.getAndCopyOrThrow(4);
                        cursor$1.writeUint32OrThrow(0);
                        const hasher = tslib_es6.__addDisposableResource(env_3, target.backward_digest.cloneOrThrow(), false);
                        const digest = tslib_es6.__addDisposableResource(env_3, hasher.updateOrThrow(cursor$1.bytes).finalizeOrThrow(), false);
                        if (!bytes.Bytes.equals2(digest4, digest.bytes.subarray(0, 4))) {
                            cursor$1.offset = offset;
                            cursor$1.writeOrThrow(digest4);
                            continue;
                        }
                        target.backward_digest.updateOrThrow(cursor$1.bytes);
                        const length = cursor$1.readUint16OrThrow();
                        const bytes$1 = cursor$1.readAndCopyOrThrow(length);
                        const data = new binary.Opaque(bytes$1);
                        return new Raw(cell$1.circuit, stream, rcommand, data);
                    }
                    catch (e_2) {
                        env_3.error = e_2;
                        env_3.hasError = true;
                    }
                    finally {
                        tslib_es6.__disposeResources(env_3);
                    }
                }
                throw new errors.UnrecognisedRelayCellError();
            }
            catch (e_3) {
                env_2.error = e_3;
                env_2.hasError = true;
            }
            finally {
                tslib_es6.__disposeResources(env_2);
            }
        }
    }
    RelayEarlyCell.Raw = Raw;
    class Streamful {
        circuit;
        stream;
        rcommand;
        fragment;
        #raw;
        constructor(circuit, stream, rcommand, fragment) {
            this.circuit = circuit;
            this.stream = stream;
            this.rcommand = rcommand;
            this.fragment = fragment;
            this.#raw = new Raw(circuit, stream.id, rcommand, fragment);
        }
        static from(circuit, stream, fragment) {
            return new Streamful(circuit, stream, fragment.rcommand, fragment);
        }
        cellOrThrow() {
            return this.#raw.cellOrThrow();
        }
        static intoOrThrow(cell, readable) {
            if (cell.rcommand !== readable.rcommand)
                throw new errors.InvalidRelayCommandError();
            if (cell.stream == null)
                throw new errors.ExpectedStreamError();
            const fragment = cell.fragment.readIntoOrThrow(readable);
            return new Streamful(cell.circuit, cell.stream, readable.rcommand, fragment);
        }
    }
    RelayEarlyCell.Streamful = Streamful;
    class Streamless {
        circuit;
        stream;
        rcommand;
        fragment;
        #raw;
        constructor(circuit, stream, rcommand, fragment) {
            this.circuit = circuit;
            this.stream = stream;
            this.rcommand = rcommand;
            this.fragment = fragment;
            this.#raw = new Raw(circuit, 0, rcommand, fragment);
        }
        static from(circuit, stream, fragment) {
            return new Streamless(circuit, stream, fragment.rcommand, fragment);
        }
        cellOrThrow() {
            return this.#raw.cellOrThrow();
        }
        static intoOrThrow(cell, readable) {
            if (cell.rcommand !== readable.rcommand)
                throw new errors.InvalidRelayCommandError();
            if (cell.stream != null)
                throw new errors.UnexpectedStreamError();
            const fragment = cell.fragment.readIntoOrThrow(readable);
            return new Streamless(cell.circuit, cell.stream, readable.rcommand, fragment);
        }
    }
    RelayEarlyCell.Streamless = Streamless;
})(exports.RelayEarlyCell || (exports.RelayEarlyCell = {}));
//# sourceMappingURL=cell.cjs.map
