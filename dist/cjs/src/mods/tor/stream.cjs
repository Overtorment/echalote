'use strict';

var binary = require('@hazae41/binary');
var cascade = require('@hazae41/cascade');
var cursor = require('@hazae41/cursor');
var plume = require('@hazae41/plume');
var index = require('../console/index.cjs');
var cell$1 = require('./binary/cells/direct/relay/cell.cjs');
var cell$4 = require('./binary/cells/relayed/relay_data/cell.cjs');
var cell = require('./binary/cells/relayed/relay_end/cell.cjs');
var cell$2 = require('./binary/cells/relayed/relay_connected/cell.cjs');
var reason = require('./binary/cells/relayed/relay_end/reason.cjs');
var cell$3 = require('./binary/cells/relayed/relay_sendme/cell.cjs');

var _a, _b;
/**
 * Adapt the internal Opaque/Writable duplex to raw bytes for public consumers.
 * Owns `opaque`'s streams — do not also pipe `secret.outer` elsewhere.
 */
function bytesOuterFromOpaque(opaque) {
    const readable = opaque.readable.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk.bytes);
        },
    }));
    const toOpaque = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(new binary.Opaque(chunk));
        },
    });
    void toOpaque.readable.pipeTo(opaque.writable).catch(() => { });
    return { readable, writable: toOpaque.writable };
}
/**
 * Wrap a Uint8Array duplex as hazae41 Opaque/Writable (Cadenas TLS, Fleche, …).
 */
function asOpaqueDuplex(bytes) {
    const readable = bytes.readable.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(new binary.Opaque(chunk));
        },
    }));
    const fromWritable = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(binary.Writable.writeToBytesOrThrow(chunk));
        },
    });
    void fromWritable.readable.pipeTo(bytes.writable).catch(() => { });
    return { readable, writable: fromWritable.writable };
}
class TorStreamDuplex {
    #secret;
    #outer;
    constructor(secret) {
        this.#secret = secret;
        this.#outer = bytesOuterFromOpaque(secret.outer);
    }
    [Symbol.dispose]() {
        this.close();
    }
    get id() {
        return this.#secret.id;
    }
    get type() {
        return this.#secret.type;
    }
    /** Raw byte duplex (Uint8Array in, Uint8Array out). */
    get outer() {
        return this.#outer;
    }
    error(reason) {
        this.#secret.error(reason);
    }
    close() {
        this.#secret.close();
    }
}
class RelayEndedError extends Error {
    reason;
    #class = _a;
    name = this.#class.name;
    constructor(reason) {
        super(`Relay ended`, { cause: reason });
        this.reason = reason;
    }
}
_a = RelayEndedError;
class SecretTorStreamDuplex {
    type;
    id;
    circuit;
    #class = _b;
    duplex;
    events = new plume.SuperEventTarget();
    delivery = 500;
    package = 500;
    #onClean;
    constructor(type, id, circuit) {
        this.type = type;
        this.id = id;
        this.circuit = circuit;
        this.duplex = new cascade.FullDuplex({
            output: {
                write: c => this.#onOutputWrite(c),
            },
            error: e => this.#onDuplexError(e),
            close: () => this.#onDuplexClose()
        });
        const onCircuitClose = this.#onCircuitClose.bind(this);
        const onCircuitError = this.#onCircuitError.bind(this);
        const onRelayConnectedCell = this.#onRelayConnectedCell.bind(this);
        const onRelayDataCell = this.#onRelayDataCell.bind(this);
        const onRelayEndCell = this.#onRelayEndCell.bind(this);
        this.circuit.events.on("close", onCircuitClose, { passive: true });
        this.circuit.events.on("error", onCircuitError, { passive: true });
        this.circuit.events.on("RELAY_CONNECTED", onRelayConnectedCell, { passive: true });
        this.circuit.events.on("RELAY_DATA", onRelayDataCell, { passive: true });
        this.circuit.events.on("RELAY_END", onRelayEndCell, { passive: true });
        this.#onClean = () => {
            this.circuit.events.off("close", onCircuitClose);
            this.circuit.events.off("error", onCircuitError);
            this.circuit.events.off("RELAY_CONNECTED", onRelayConnectedCell);
            this.circuit.events.off("RELAY_DATA", onRelayDataCell);
            this.circuit.events.off("RELAY_END", onRelayEndCell);
            this.circuit.streams.delete(this.id);
            this.#onClean = () => { };
        };
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
    get closed() {
        return this.duplex.closed;
    }
    close() {
        this.duplex.close();
    }
    error(reason) {
        this.duplex.error(reason);
    }
    async #onDuplexClose() {
        if (!this.circuit.closed) {
            const relay_end_cell = new cell.RelayEndCell(new reason.RelayEndReasonOther(cell.RelayEndCell.reasons.REASON_DONE));
            const relay_cell = cell$1.RelayCell.Streamful.from(this.circuit, this, relay_end_cell);
            this.circuit.tor.output.enqueue(relay_cell.cellOrThrow());
            this.package--;
        }
        await this.events.emit("close");
        this.#onClean();
    }
    async #onDuplexError(reason$1) {
        if (!this.circuit.closed) {
            const relay_end_cell = new cell.RelayEndCell(new reason.RelayEndReasonOther(cell.RelayEndCell.reasons.REASON_MISC));
            const relay_cell = cell$1.RelayCell.Streamful.from(this.circuit, this, relay_end_cell);
            this.circuit.tor.output.enqueue(relay_cell.cellOrThrow());
            this.package--;
        }
        await this.events.emit("error", reason$1);
        this.#onClean();
    }
    async #onCircuitClose() {
        index.Console.debug(`${this.#class.name}.onCircuitClose`);
        if (this.duplex.closing)
            return;
        this.duplex.close();
    }
    async #onCircuitError(reason) {
        index.Console.debug(`${this.#class.name}.onCircuitError`, { reason });
        if (this.duplex.closing)
            return;
        this.duplex.error(reason);
    }
    async #onRelayConnectedCell(cell) {
        if (cell.stream !== this)
            return;
        if (this.type === "directory") {
            await this.events.emit("connected");
            return;
        }
        if (this.type === "external") {
            const cell2 = cell$1.RelayCell.Streamful.intoOrThrow(cell, cell$2.RelayConnectedCell);
            index.Console.debug(`${this.#class.name}.onRelayConnectedCell`, cell2);
            await this.events.emit("connected");
            return;
        }
    }
    async #onRelayDataCell(cell) {
        if (cell.stream !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayDataCell`, cell);
        this.delivery--;
        if (this.delivery === 450) {
            this.delivery = 500;
            const sendme = new cell$3.RelaySendmeStreamCell();
            const sendme_cell = cell$1.RelayCell.Streamful.from(this.circuit, this, sendme);
            this.circuit.tor.output.enqueue(sendme_cell.cellOrThrow());
        }
        this.input.enqueue(cell.fragment.fragment);
    }
    async #onRelayEndCell(cell$1) {
        if (cell$1.stream !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayEndCell`, cell$1);
        if (this.duplex.closing)
            return;
        if (cell$1.fragment.reason.id === cell.RelayEndCell.reasons.REASON_DONE)
            this.duplex.close();
        else
            this.duplex.error(new RelayEndedError(cell$1.fragment.reason));
    }
    async #onOutputWrite(writable) {
        if (writable.sizeOrThrow() > cell$1.RelayCell.DATA_LEN)
            return await this.#onWriteChunked(writable);
        return await this.#onWriteDirect(writable);
    }
    async #onWriteDirect(writable) {
        const relay_data_cell = new cell$4.RelayDataCell(writable);
        const relay_cell = cell$1.RelayCell.Streamful.from(this.circuit, this, relay_data_cell);
        this.circuit.tor.output.enqueue(relay_cell.cellOrThrow());
        this.package--;
    }
    async #onWriteChunked(writable) {
        const bytes = binary.Writable.writeToBytesOrThrow(writable);
        const cursor$1 = new cursor.Cursor(bytes);
        for (const chunk of cursor$1.splitOrThrow(cell$1.RelayCell.DATA_LEN))
            await this.#onWriteDirect(new binary.Opaque(chunk));
        return;
    }
}
_b = SecretTorStreamDuplex;

exports.RelayEndedError = RelayEndedError;
exports.SecretTorStreamDuplex = SecretTorStreamDuplex;
exports.TorStreamDuplex = TorStreamDuplex;
exports.asOpaqueDuplex = asOpaqueDuplex;
//# sourceMappingURL=stream.cjs.map
