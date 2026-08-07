import { Opaque } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';
import { InvalidCommandError, ExpectedCircuitError, UnexpectedCircuitError } from './errors.mjs';

var Cell;
(function (Cell) {
    Cell.PAYLOAD_LEN = 509;
    class Raw {
        circuit;
        command;
        fragment;
        constructor(circuit, command, fragment) {
            this.circuit = circuit;
            this.command = command;
            this.fragment = fragment;
        }
        unpackOrNull(tor) {
            if (this.circuit === 0)
                return new Circuitless(undefined, this.command, this.fragment);
            const circuit = tor.circuits.inner.get(this.circuit);
            if (circuit == null)
                return undefined;
            return new Circuitful(circuit, this.command, this.fragment);
        }
        sizeOrThrow() {
            return this.command >= 128
                ? 4 + 1 + 2 + this.fragment.sizeOrThrow()
                : 4 + 1 + Cell.PAYLOAD_LEN;
        }
        writeOrThrow(cursor) {
            if (this.command >= 128) {
                cursor.writeUint32OrThrow(this.circuit);
                cursor.writeUint8OrThrow(this.command);
                const size = this.fragment.sizeOrThrow();
                cursor.writeUint16OrThrow(size);
                this.fragment.writeOrThrow(cursor);
                return;
            }
            cursor.writeUint32OrThrow(this.circuit);
            cursor.writeUint8OrThrow(this.command);
            const payload = cursor.readOrThrow(Cell.PAYLOAD_LEN);
            const subcursor = new Cursor(payload);
            this.fragment.writeOrThrow(subcursor);
            subcursor.fillOrThrow(0, subcursor.remaining);
        }
        static readOrThrow(cursor) {
            const circuit = cursor.readUint32OrThrow();
            const command = cursor.readUint8OrThrow();
            if (command >= 128) {
                const length = cursor.readUint16OrThrow();
                const bytes = cursor.readAndCopyOrThrow(length);
                const payload = new Opaque(bytes);
                return new Raw(circuit, command, payload);
            }
            const bytes = cursor.readAndCopyOrThrow(Cell.PAYLOAD_LEN);
            const payload = new Opaque(bytes);
            return new Raw(circuit, command, payload);
        }
    }
    Cell.Raw = Raw;
    class Circuitful {
        circuit;
        command;
        fragment;
        #raw;
        constructor(circuit, command, fragment) {
            this.circuit = circuit;
            this.command = command;
            this.fragment = fragment;
            this.#raw = new Raw(circuit.id, command, fragment);
        }
        static from(circuit, cellable) {
            return new Circuitful(circuit, cellable.command, cellable);
        }
        sizeOrThrow() {
            return this.#raw.sizeOrThrow();
        }
        writeOrThrow(cursor) {
            this.#raw.writeOrThrow(cursor);
        }
        static intoOrThrow(cell, readable) {
            if (cell.command !== readable.command)
                throw new InvalidCommandError();
            if (cell.circuit == null)
                throw new ExpectedCircuitError();
            const fragment = cell.fragment.readIntoOrThrow(readable);
            return new Circuitful(cell.circuit, readable.command, fragment);
        }
    }
    Cell.Circuitful = Circuitful;
    class Circuitless {
        circuit;
        command;
        fragment;
        #raw;
        constructor(circuit, command, fragment) {
            this.circuit = circuit;
            this.command = command;
            this.fragment = fragment;
            this.#raw = new Raw(0, command, fragment);
        }
        static from(circuit, cellable) {
            return new Circuitless(circuit, cellable.command, cellable);
        }
        sizeOrThrow() {
            return this.#raw.sizeOrThrow();
        }
        writeOrThrow(cursor) {
            this.#raw.writeOrThrow(cursor);
        }
        static intoOrThrow(cell, readable) {
            if (cell.command !== readable.command)
                throw new InvalidCommandError();
            if (cell.circuit != null)
                throw new UnexpectedCircuitError();
            const fragment = cell.fragment.readIntoOrThrow(readable);
            return new Circuitless(cell.circuit, readable.command, fragment);
        }
    }
    Cell.Circuitless = Circuitless;
})(Cell || (Cell = {}));

export { Cell };
//# sourceMappingURL=cell.mjs.map
