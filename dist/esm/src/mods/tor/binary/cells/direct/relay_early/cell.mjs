import { __addDisposableResource, __disposeResources } from '../../../../../../../node_modules/tslib/tslib.es6.mjs';
import { AesWasm } from '../../../../../../libs/aes/index.mjs';
import { Opaque } from '@hazae41/binary';
import { Bytes } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';
import { Cell } from '../../cell.mjs';
import { UnknownStreamError, ExpectedCircuitError, UnrecognisedRelayCellError, InvalidRelayCommandError, ExpectedStreamError, UnexpectedStreamError } from '../../errors.mjs';

var RelayEarlyCell;
(function (RelayEarlyCell) {
    RelayEarlyCell.HEAD_LEN = 1 + 2 + 2 + 4 + 2;
    RelayEarlyCell.DATA_LEN = Cell.PAYLOAD_LEN - RelayEarlyCell.HEAD_LEN;
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
                throw new UnknownStreamError();
            return new Streamful(this.circuit, stream, this.rcommand, this.fragment);
        }
        cellOrThrow() {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const cursor = new Cursor(new Uint8Array(Cell.PAYLOAD_LEN));
                cursor.writeUint8OrThrow(this.rcommand);
                cursor.writeUint16OrThrow(0);
                cursor.writeUint16OrThrow(this.stream);
                const digestOffset = cursor.offset;
                cursor.writeUint32OrThrow(0);
                const size = this.fragment.sizeOrThrow();
                cursor.writeUint16OrThrow(size);
                this.fragment.writeOrThrow(cursor);
                cursor.fillOrThrow(0, Math.min(cursor.remaining, 4));
                cursor.writeOrThrow(Bytes.random(cursor.remaining));
                const exit = this.circuit.targets[this.circuit.targets.length - 1];
                exit.forward_digest.updateOrThrow(cursor.bytes);
                const digestSlice = __addDisposableResource(env_1, exit.forward_digest.finalizeOrThrow(), false);
                cursor.offset = digestOffset;
                cursor.writeOrThrow(digestSlice.bytes.subarray(0, 4));
                const memory = __addDisposableResource(env_1, new AesWasm.Memory(cursor.bytes), false);
                for (let i = this.circuit.targets.length - 1; i >= 0; i--)
                    this.circuit.targets[i].forward_key.apply_keystream(memory);
                const fragment = new Opaque(new Uint8Array(memory.bytes));
                return new Cell.Circuitful(this.circuit, RelayEarlyCell.command, fragment);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        }
        static uncellOrThrow(cell) {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                if (cell instanceof Cell.Circuitless)
                    throw new ExpectedCircuitError();
                const memory = __addDisposableResource(env_2, new AesWasm.Memory(cell.fragment.bytes), false);
                for (const target of cell.circuit.targets) {
                    const env_3 = { stack: [], error: void 0, hasError: false };
                    try {
                        target.backward_key.apply_keystream(memory);
                        const cursor = new Cursor(memory.bytes);
                        const rcommand = cursor.readUint8OrThrow();
                        const recognised = cursor.readUint16OrThrow();
                        if (recognised !== 0)
                            continue;
                        const stream = cursor.readUint16OrThrow();
                        const offset = cursor.offset;
                        const digest4 = cursor.getAndCopyOrThrow(4);
                        cursor.writeUint32OrThrow(0);
                        const hasher = __addDisposableResource(env_3, target.backward_digest.cloneOrThrow(), false);
                        const digest = __addDisposableResource(env_3, hasher.updateOrThrow(cursor.bytes).finalizeOrThrow(), false);
                        if (!Bytes.equals2(digest4, digest.bytes.subarray(0, 4))) {
                            cursor.offset = offset;
                            cursor.writeOrThrow(digest4);
                            continue;
                        }
                        target.backward_digest.updateOrThrow(cursor.bytes);
                        const length = cursor.readUint16OrThrow();
                        const bytes = cursor.readAndCopyOrThrow(length);
                        const data = new Opaque(bytes);
                        return new Raw(cell.circuit, stream, rcommand, data);
                    }
                    catch (e_2) {
                        env_3.error = e_2;
                        env_3.hasError = true;
                    }
                    finally {
                        __disposeResources(env_3);
                    }
                }
                throw new UnrecognisedRelayCellError();
            }
            catch (e_3) {
                env_2.error = e_3;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
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
                throw new InvalidRelayCommandError();
            if (cell.stream == null)
                throw new ExpectedStreamError();
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
                throw new InvalidRelayCommandError();
            if (cell.stream != null)
                throw new UnexpectedStreamError();
            const fragment = cell.fragment.readIntoOrThrow(readable);
            return new Streamless(cell.circuit, cell.stream, readable.rcommand, fragment);
        }
    }
    RelayEarlyCell.Streamless = Streamless;
})(RelayEarlyCell || (RelayEarlyCell = {}));

export { RelayEarlyCell };
//# sourceMappingURL=cell.mjs.map
