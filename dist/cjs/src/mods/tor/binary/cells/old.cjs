'use strict';

var binary = require('@hazae41/binary');
var cursor = require('@hazae41/cursor');
var errors = require('./errors.cjs');

exports.OldCell = void 0;
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
        writeOrThrow(cursor$1) {
            if (this.command === 7) {
                cursor$1.writeUint16OrThrow(this.circuit);
                cursor$1.writeUint8OrThrow(this.command);
                const size = this.fragment.sizeOrThrow();
                cursor$1.writeUint16OrThrow(size);
                this.fragment.writeOrThrow(cursor$1);
                return;
            }
            cursor$1.writeUint16OrThrow(this.circuit);
            cursor$1.writeUint8OrThrow(this.command);
            const payload = cursor$1.readOrThrow(OldCell.PAYLOAD_LEN);
            const subcursor = new cursor.Cursor(payload);
            this.fragment.writeOrThrow(subcursor);
            subcursor.fillOrThrow(0, subcursor.remaining);
        }
        static readOrThrow(cursor) {
            const circuit = cursor.readUint16OrThrow();
            const command = cursor.readUint8OrThrow();
            if (command === 7) {
                const length = cursor.readUint16OrThrow();
                const bytes = cursor.readAndCopyOrThrow(length);
                const payload = new binary.Opaque(bytes);
                return new Raw(circuit, command, payload);
            }
            const bytes = cursor.readAndCopyOrThrow(OldCell.PAYLOAD_LEN);
            const payload = new binary.Opaque(bytes);
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
                throw new errors.InvalidCommandError();
            if (cell.circuit == null)
                throw new errors.ExpectedCircuitError();
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
                throw new errors.InvalidCommandError();
            if (cell.circuit != null)
                throw new errors.UnexpectedCircuitError();
            const fragment = cell.fragment.readIntoOrThrow(readable);
            return new Circuitless(cell.circuit, readable.command, fragment);
        }
    }
    OldCell.Circuitless = Circuitless;
})(exports.OldCell || (exports.OldCell = {}));
//# sourceMappingURL=old.cjs.map
