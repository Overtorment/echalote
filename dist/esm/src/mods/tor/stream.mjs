import { Writable, Opaque } from '@hazae41/binary';
import { FullDuplex } from '@hazae41/cascade';
import { Cursor } from '@hazae41/cursor';
import { SuperEventTarget } from '@hazae41/plume';
import { Console } from '../console/index.mjs';
import { RelayCell } from './binary/cells/direct/relay/cell.mjs';
import { RelayDataCell } from './binary/cells/relayed/relay_data/cell.mjs';
import { RelayEndCell } from './binary/cells/relayed/relay_end/cell.mjs';
import { RelayConnectedCell } from './binary/cells/relayed/relay_connected/cell.mjs';
import { RelayEndReasonOther } from './binary/cells/relayed/relay_end/reason.mjs';
import { RelaySendmeStreamCell } from './binary/cells/relayed/relay_sendme/cell.mjs';

var _a, _b;
class TorStreamDuplex {
    #secret;
    constructor(secret) {
        this.#secret = secret;
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
    get inner() {
        return this.#secret.inner;
    }
    get outer() {
        return this.#secret.outer;
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
    events = new SuperEventTarget();
    delivery = 500;
    package = 500;
    #onClean;
    constructor(type, id, circuit) {
        this.type = type;
        this.id = id;
        this.circuit = circuit;
        this.duplex = new FullDuplex({
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
            const relay_end_cell = new RelayEndCell(new RelayEndReasonOther(RelayEndCell.reasons.REASON_DONE));
            const relay_cell = RelayCell.Streamful.from(this.circuit, this, relay_end_cell);
            this.circuit.tor.output.enqueue(relay_cell.cellOrThrow());
            this.package--;
        }
        await this.events.emit("close");
        this.#onClean();
    }
    async #onDuplexError(reason) {
        if (!this.circuit.closed) {
            const relay_end_cell = new RelayEndCell(new RelayEndReasonOther(RelayEndCell.reasons.REASON_MISC));
            const relay_cell = RelayCell.Streamful.from(this.circuit, this, relay_end_cell);
            this.circuit.tor.output.enqueue(relay_cell.cellOrThrow());
            this.package--;
        }
        await this.events.emit("error", reason);
        this.#onClean();
    }
    async #onCircuitClose() {
        Console.debug(`${this.#class.name}.onCircuitClose`);
        if (this.duplex.closing)
            return;
        this.duplex.close();
    }
    async #onCircuitError(reason) {
        Console.debug(`${this.#class.name}.onCircuitError`, { reason });
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
            const cell2 = RelayCell.Streamful.intoOrThrow(cell, RelayConnectedCell);
            Console.debug(`${this.#class.name}.onRelayConnectedCell`, cell2);
            await this.events.emit("connected");
            return;
        }
    }
    async #onRelayDataCell(cell) {
        if (cell.stream !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayDataCell`, cell);
        this.delivery--;
        if (this.delivery === 450) {
            this.delivery = 500;
            const sendme = new RelaySendmeStreamCell();
            const sendme_cell = RelayCell.Streamful.from(this.circuit, this, sendme);
            this.circuit.tor.output.enqueue(sendme_cell.cellOrThrow());
        }
        this.input.enqueue(cell.fragment.fragment);
    }
    async #onRelayEndCell(cell) {
        if (cell.stream !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayEndCell`, cell);
        if (this.duplex.closing)
            return;
        if (cell.fragment.reason.id === RelayEndCell.reasons.REASON_DONE)
            this.duplex.close();
        else
            this.duplex.error(new RelayEndedError(cell.fragment.reason));
    }
    async #onOutputWrite(writable) {
        if (writable.sizeOrThrow() > RelayCell.DATA_LEN)
            return await this.#onWriteChunked(writable);
        return await this.#onWriteDirect(writable);
    }
    async #onWriteDirect(writable) {
        const relay_data_cell = new RelayDataCell(writable);
        const relay_cell = RelayCell.Streamful.from(this.circuit, this, relay_data_cell);
        this.circuit.tor.output.enqueue(relay_cell.cellOrThrow());
        this.package--;
    }
    async #onWriteChunked(writable) {
        const bytes = Writable.writeToBytesOrThrow(writable);
        const cursor = new Cursor(bytes);
        for (const chunk of cursor.splitOrThrow(RelayCell.DATA_LEN))
            await this.#onWriteDirect(new Opaque(chunk));
        return;
    }
}
_b = SecretTorStreamDuplex;

export { RelayEndedError, SecretTorStreamDuplex, TorStreamDuplex };
//# sourceMappingURL=stream.mjs.map
