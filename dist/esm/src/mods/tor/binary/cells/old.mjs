import { Opaque } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';
import { InvalidCommandError, ExpectedCircuitError, UnexpectedCircuitError } from './errors.mjs';

var OldCell;
(function (OldCell) {
    OldCell.PAYLOAD_LEN = 509;
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
            return this.command === 7
                ? 2 + 1 + 2 + this.fragment.sizeOrThrow()
                : 2 + 1 + OldCell.PAYLOAD_LEN;
        }
        writeOrThrow(cursor) {
            if (this.command === 7) {
                cursor.writeUint16OrThrow(this.circuit);
                cursor.writeUint8OrThrow(this.command);
                const size = this.fragment.sizeOrThrow();
                cursor.writeUint16OrThrow(size);
                this.fragment.writeOrThrow(cursor);
                return;
            }
            cursor.writeUint16OrThrow(this.circuit);
            cursor.writeUint8OrThrow(this.command);
            const payload = cursor.readOrThrow(OldCell.PAYLOAD_LEN);
            const subcursor = new Cursor(payload);
            this.fragment.writeOrThrow(subcursor);
            subcursor.fillOrThrow(0, subcursor.remaining);
        }
        static readOrThrow(cursor) {
            const circuit = cursor.readUint16OrThrow();
            const command = cursor.readUint8OrThrow();
            if (command === 7) {
                const length = cursor.readUint16OrThrow();
                const bytes = cursor.readAndCopyOrThrow(length);
                const payload = new Opaque(bytes);
                return new Raw(circuit, command, payload);
            }
            const bytes = cursor.readAndCopyOrThrow(OldCell.PAYLOAD_LEN);
            const payload = new Opaque(bytes);
            return new Raw(circuit, command, payload);
        }
    }
    OldCell.Raw = Raw;
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
    OldCell.Circuitful = Circuitful;
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
    OldCell.Circuitless = Circuitless;
})(OldCell || (OldCell = {}));

export { OldCell };
//# sourceMappingURL=old.mjs.map
