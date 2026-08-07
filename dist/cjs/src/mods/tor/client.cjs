'use strict';

var tslib_es6 = require('../../../node_modules/tslib/tslib.es6.cjs');
var index$1 = require('../../libs/aes/index.cjs');
var binary = require('@hazae41/binary');
var bitset = require('@hazae41/bitset');
var bytes = require('@hazae41/bytes');
var cadenas = require('@hazae41/cadenas');
var cascade = require('@hazae41/cascade');
var cursor = require('@hazae41/cursor');
var future = require('@hazae41/future');
var mutex = require('@hazae41/mutex');
var plume = require('@hazae41/plume');
var index = require('../../libs/rsa/index.cjs');
var sha1 = require('@hazae41/sha1');
var resizer = require('../../libs/resizer/resizer.cjs');
var index$2 = require('../console/index.cjs');
var init = require('../crypto/init.cjs');
var address = require('./binary/address.cjs');
var cell$1 = require('./binary/cells/cell.cjs');
var cell$5 = require('./binary/cells/direct/auth_challenge/cell.cjs');
var cell$4 = require('./binary/cells/direct/certs/cell.cjs');
var cell$i = require('./binary/cells/direct/create_fast/cell.cjs');
var cell$7 = require('./binary/cells/direct/created_fast/cell.cjs');
var cell$8 = require('./binary/cells/direct/destroy/cell.cjs');
var cell$6 = require('./binary/cells/direct/netinfo/cell.cjs');
var cell$2 = require('./binary/cells/direct/padding/cell.cjs');
var cell$a = require('./binary/cells/direct/padding_negociate/cell.cjs');
var cell$9 = require('./binary/cells/direct/relay/cell.cjs');
var cell = require('./binary/cells/direct/versions/cell.cjs');
var cell$3 = require('./binary/cells/direct/vpadding/cell.cjs');
var cell$c = require('./binary/cells/relayed/relay_connected/cell.cjs');
var cell$d = require('./binary/cells/relayed/relay_data/cell.cjs');
var cell$f = require('./binary/cells/relayed/relay_drop/cell.cjs');
var cell$e = require('./binary/cells/relayed/relay_end/cell.cjs');
var cell$b = require('./binary/cells/relayed/relay_extended2/cell.cjs');
var cell$g = require('./binary/cells/relayed/relay_truncated/cell.cjs');
var circuit = require('./circuit.cjs');
var target = require('./target.cjs');
var kdftor = require('./algorithms/kdftor.cjs');
var errors = require('./binary/cells/errors.cjs');
var old = require('./binary/cells/old.cjs');
var cell$h = require('./binary/cells/relayed/relay_sendme/cell.cjs');
var certs = require('./certs/certs.cjs');
var errors$1 = require('./errors.cjs');

class TorClientDuplex {
    #secret;
    events = new plume.SuperEventTarget();
    constructor() {
        this.#secret = new SecretTorClientDuplex();
        this.#secret.events.on("close", () => this.events.emit("close"));
        this.#secret.events.on("error", e => this.events.emit("error", e));
    }
    [Symbol.dispose]() {
        this.close();
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
    async waitOrThrow(signal = new AbortController().signal) {
        return await this.#secret.waitOrThrow(signal);
    }
    async createOrThrow(signal = new AbortController().signal) {
        return await this.#secret.createOrThrow(signal);
    }
}
class SecretTorClientDuplex {
    ciphers = [cadenas.Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384];
    tls;
    duplex;
    events = new plume.SuperEventTarget();
    circuits = new mutex.Mutex(new Map());
    #buffer = new resizer.Resizer();
    #resolveOnStart = new future.Future();
    #resolveOnTlsCertificates = new future.Future();
    #state = { type: "none" };
    constructor() {
        this.tls = new cadenas.TlsClientDuplex({
            /**
             * Do not validate root certificates
             */
            authorized: true,
            ciphers: [cadenas.Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384],
            certificates: c => this.#resolveOnTlsCertificates.resolve(c)
        });
        this.duplex = new cascade.HalfDuplex({
            output: {
                start: () => this.#onOutputStart(),
            },
            input: {
                write: c => this.#onInputWrite(c),
            },
            close: async () => void await this.events.emit("close"),
            error: async (e) => void await this.events.emit("error", e)
        });
        this.tls.outer.readable.pipeTo(this.duplex.inner.writable).catch(() => { });
        this.duplex.inner.readable.pipeTo(this.tls.outer.writable).catch(() => { });
        this.#resolveOnStart.resolve();
    }
    [Symbol.dispose]() {
        this.close();
    }
    async #init() {
        await init.initBundledCrypto();
        await index.RsaWasm.initBundled();
        await index$1.AesWasm.initBundled();
    }
    get state() {
        return this.#state;
    }
    /**
     * TLS inner pair
     */
    get inner() {
        return this.tls.inner;
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
    async #onOutputStart() {
        await this.#resolveOnStart.promise;
        await this.#init();
        this.output.enqueue(old.OldCell.Circuitless.from(undefined, new cell.VersionsCell([5])));
        await plume.Plume.waitWithCloseAndErrorOrThrow(this.events, "handshaked", (future) => future.resolve());
    }
    async #onInputWrite(chunk) {
        // Console.debug(this.#class.name, "<-", chunk)
        if (this.#buffer.inner.offset)
            await this.#onReadBuffered(chunk.bytes);
        else
            await this.#onReadDirect(chunk.bytes);
    }
    /**
     * Read from buffer
     * @param chunk
     * @returns
     */
    async #onReadBuffered(chunk) {
        this.#buffer.writeOrThrow(chunk);
        const full = new Uint8Array(this.#buffer.inner.before);
        this.#buffer.inner.offset = 0;
        await this.#onReadDirect(full);
    }
    /**
     * Zero-copy reading
     * @param chunk
     * @returns
     */
    async #onReadDirect(chunk) {
        const cursor$1 = new cursor.Cursor(chunk);
        while (cursor$1.remaining) {
            let raw;
            try {
                raw = this.#state.type === "none"
                    ? binary.Readable.readOrRollbackAndThrow(old.OldCell.Raw, cursor$1)
                    : binary.Readable.readOrRollbackAndThrow(cell$1.Cell.Raw, cursor$1);
            }
            catch (e) {
                this.#buffer.writeOrThrow(cursor$1.after);
                break;
            }
            const cell = raw.unpackOrNull(this);
            if (cell == null)
                continue;
            await this.#onCell(cell, this.#state);
        }
    }
    async #onCell(cell, state) {
        if (cell.command === cell$2.PaddingCell.command) {
            index$2.Console.debug(cell);
            return;
        }
        if (cell.command === cell$3.VariablePaddingCell.command) {
            index$2.Console.debug(cell);
            return;
        }
        if (state.type === "none")
            return await this.#onNoneStateCell(cell, state);
        if (cell instanceof old.OldCell.Circuitful)
            throw new errors.InvalidCellError();
        if (cell instanceof old.OldCell.Circuitless)
            throw new errors.InvalidCellError();
        if (state.type === "versioned")
            return await this.#onVersionedStateCell(cell, state);
        if (state.type === "handshaking")
            return await this.#onHandshakingStateCell(cell, state);
        if (state.type === "handshaked")
            return await this.#onHandshakedStateCell(cell);
        return state;
    }
    async #onNoneStateCell(cell$2, state) {
        if (cell$2 instanceof cell$1.Cell.Circuitful)
            throw new errors.InvalidCellError();
        if (cell$2 instanceof cell$1.Cell.Circuitless)
            throw new errors.InvalidCellError();
        if (cell$2.command === cell.VersionsCell.command)
            return await this.#onVersionsCell(cell$2, state);
        console.warn(`Unknown pre-version cell ${cell$2.command}`);
    }
    async #onVersionedStateCell(cell, state) {
        if (cell.command === cell$4.CertsCell.command)
            return await this.#onCertsCell(cell, state);
        console.warn(`Unknown versioned-state cell ${cell.command}`);
    }
    async #onHandshakingStateCell(cell, state) {
        if (cell.command === cell$5.AuthChallengeCell.command)
            return await this.#onAuthChallengeCell(cell, state);
        if (cell.command === cell$6.NetinfoCell.command)
            return await this.#onNetinfoCell(cell, state);
        console.warn(`Unknown handshaking-state cell ${cell.command}`);
    }
    async #onHandshakedStateCell(cell) {
        if (cell.command === cell$7.CreatedFastCell.command)
            return await this.#onCreatedFastCell(cell);
        if (cell.command === cell$8.DestroyCell.command)
            return await this.#onDestroyCell(cell);
        if (cell.command === cell$9.RelayCell.command)
            return await this.#onRelayCell(cell);
        console.warn(`Unknown handshaked-state cell ${cell.command}`);
    }
    async #onVersionsCell(cell$1, state) {
        const cell2 = old.OldCell.Circuitless.intoOrThrow(cell$1, cell.VersionsCell);
        index$2.Console.debug(cell2);
        if (!cell2.fragment.versions.includes(5))
            throw new errors$1.InvalidTorVersionError();
        this.#state = { ...state, type: "versioned", version: 5 };
    }
    async #onCertsCell(cell, state) {
        const cell2 = cell$1.Cell.Circuitless.intoOrThrow(cell, cell$4.CertsCell);
        index$2.Console.debug(cell2);
        const tlsCerts = await this.#resolveOnTlsCertificates.promise;
        const torCerts = await certs.Certs.verifyOrThrow(cell2.fragment.certs, tlsCerts);
        const identity = await torCerts.rsa_self.sha1OrThrow();
        const guard = { certs: torCerts, identity };
        this.#state = { ...state, type: "handshaking", guard };
    }
    async #onAuthChallengeCell(cell, state) {
        index$2.Console.debug(cell$1.Cell.Circuitless.intoOrThrow(cell, cell$5.AuthChallengeCell));
    }
    async #onNetinfoCell(cell, state) {
        const cell2 = cell$1.Cell.Circuitless.intoOrThrow(cell, cell$6.NetinfoCell);
        index$2.Console.debug(cell2);
        const address$1 = new address.TypedAddress(4, new Uint8Array([127, 0, 0, 1]));
        const netinfo = new cell$6.NetinfoCell(0, address$1, []);
        this.output.enqueue(cell$1.Cell.Circuitless.from(undefined, netinfo));
        const pversion = cell$a.PaddingNegociateCell.versions.ZERO;
        const pcommand = cell$a.PaddingNegociateCell.commands.STOP;
        const padding_negociate = new cell$a.PaddingNegociateCell(pversion, pcommand, 0, 0);
        this.output.enqueue(cell$1.Cell.Circuitless.from(undefined, padding_negociate));
        this.#state = { ...state, type: "handshaked" };
        await this.events.emit("handshaked");
    }
    async #onCreatedFastCell(cell) {
        const cell2 = cell$1.Cell.Circuitful.intoOrThrow(cell, cell$7.CreatedFastCell);
        index$2.Console.debug(cell2);
        await this.events.emit("CREATED_FAST", cell2);
    }
    async #onDestroyCell(cell) {
        const cell2 = cell$1.Cell.Circuitful.intoOrThrow(cell, cell$8.DestroyCell);
        index$2.Console.debug(cell2);
        this.circuits.inner.delete(cell2.circuit.id);
        await this.events.emit("DESTROY", cell2);
    }
    async #onRelayCell(parent) {
        const raw = cell$9.RelayCell.Raw.uncellOrThrow(parent);
        const cell = raw.unpackOrNull();
        if (cell == null)
            return;
        if (cell.rcommand === cell$b.RelayExtended2Cell.rcommand)
            return await this.#onRelayExtended2Cell(cell);
        if (cell.rcommand === cell$c.RelayConnectedCell.rcommand)
            return await this.#onRelayConnectedCell(cell);
        if (cell.rcommand === cell$d.RelayDataCell.rcommand)
            return await this.#onRelayDataCell(cell);
        if (cell.rcommand === cell$e.RelayEndCell.rcommand)
            return await this.#onRelayEndCell(cell);
        if (cell.rcommand === cell$f.RelayDropCell.rcommand)
            return await this.#onRelayDropCell(cell);
        if (cell.rcommand === cell$g.RelayTruncatedCell.rcommand)
            return await this.#onRelayTruncatedCell(cell);
        if (cell.rcommand === cell$h.RelaySendmeCircuitCell.rcommand && cell.stream == null)
            return await this.#onRelaySendmeCircuitCell(cell);
        if (cell.rcommand === cell$h.RelaySendmeStreamCell.rcommand && cell.stream != null)
            return await this.#onRelaySendmeStreamCell(cell);
        console.warn(`Unknown relay cell ${cell.rcommand}`);
    }
    async #onRelayExtended2Cell(cell) {
        const cell2 = cell$9.RelayCell.Streamless.intoOrThrow(cell, cell$b.RelayExtended2Cell);
        index$2.Console.debug(cell2);
        await this.events.emit("RELAY_EXTENDED2", cell2);
    }
    async #onRelayConnectedCell(cell) {
        if (cell.stream == null)
            throw new errors.ExpectedStreamError();
        await this.events.emit("RELAY_CONNECTED", cell);
    }
    async #onRelayDataCell(cell) {
        const cell2 = cell$9.RelayCell.Streamful.intoOrThrow(cell, cell$d.RelayDataCell);
        index$2.Console.debug(cell2);
        const exit = cell2.circuit.targets[cell2.circuit.targets.length - 1];
        exit.delivery--;
        if (exit.delivery === 900) {
            exit.delivery = 1000;
            if (cell2.digest == null)
                throw new errors.InvalidRelayCellDigestError();
            const digest = new cell$h.RelaySendmeDigest(cell2.digest);
            const sendme = new cell$h.RelaySendmeCircuitCell(1, digest);
            const sendme_cell = cell$9.RelayCell.Streamless.from(cell2.circuit, undefined, sendme);
            this.output.enqueue(sendme_cell.cellOrThrow());
        }
        await this.events.emit("RELAY_DATA", cell2);
    }
    async #onRelayEndCell(cell) {
        const cell2 = cell$9.RelayCell.Streamful.intoOrThrow(cell, cell$e.RelayEndCell);
        index$2.Console.debug(cell2);
        await this.events.emit("RELAY_END", cell2);
    }
    async #onRelayDropCell(cell) {
        index$2.Console.debug(cell$9.RelayCell.Streamful.intoOrThrow(cell, cell$f.RelayDropCell));
    }
    async #onRelayTruncatedCell(cell) {
        const cell2 = cell$9.RelayCell.Streamless.intoOrThrow(cell, cell$g.RelayTruncatedCell);
        index$2.Console.debug(cell2);
        cell2.circuit.targets.pop();
        await this.events.emit("RELAY_TRUNCATED", cell2);
    }
    async #onRelaySendmeCircuitCell(cell) {
        const cell2 = cell$9.RelayCell.Streamless.intoOrThrow(cell, cell$h.RelaySendmeCircuitCell);
        index$2.Console.debug(cell2);
        if (cell2.fragment.version === 0) {
            const exit = cell2.circuit.targets[cell2.circuit.targets.length - 1];
            exit.package += 100;
            return;
        }
        if (cell2.fragment.version === 1) {
            const digest = cell2.fragment.fragment.readIntoOrThrow(cell$h.RelaySendmeDigest);
            index$2.Console.debug(digest);
            const exit = cell2.circuit.targets[cell2.circuit.targets.length - 1];
            const digest2 = exit.digests.shift();
            if (digest2 == null)
                throw new errors.InvalidRelaySendmeCellDigestError();
            if (!bytes.Bytes.equals(digest.digest, digest2))
                throw new errors.InvalidRelaySendmeCellDigestError();
            exit.package += 100;
            return;
        }
        console.warn(`Unknown RELAY_SENDME circuit cell version ${cell2.fragment.version}`);
    }
    async #onRelaySendmeStreamCell(cell) {
        const cell2 = cell$9.RelayCell.Streamful.intoOrThrow(cell, cell$h.RelaySendmeStreamCell);
        index$2.Console.debug(cell2);
        cell2.stream.package += 50;
    }
    async waitOrThrow(signal = new AbortController().signal) {
        if (this.state.type === "handshaked")
            return;
        await plume.Plume.waitWithCloseAndErrorOrThrow(this.events, "handshaked", (future) => future.resolve(), signal);
    }
    async #createCircuitOrThrow(signal = new AbortController().signal) {
        return await this.circuits.runOrWait((circuits) => {
            while (!signal.aborted) {
                const rawCircuitId = new cursor.Cursor(bytes.Bytes.random(4)).getUint32OrThrow();
                if (rawCircuitId === 0)
                    continue;
                const circuitId = new bitset.Bitset(rawCircuitId, 32)
                    .enableBE(0)
                    .unsign()
                    .value;
                if (circuits.has(circuitId))
                    continue;
                const circuit$1 = new circuit.SecretCircuit(circuitId, this);
                circuits.set(circuitId, circuit$1);
                return circuit$1;
            }
            throw new Error("Aborted", { cause: signal.reason });
        });
    }
    async #waitCreatedFast(circuit, signal = new AbortController().signal) {
        return await plume.Plume.waitWithCloseAndErrorOrThrow(this.events, "CREATED_FAST", async (future, e) => {
            if (e.circuit !== circuit)
                return;
            future.resolve(e);
        }, signal);
    }
    async createOrThrow(signal = new AbortController().signal) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            if (this.#state.type !== "handshaked")
                throw new errors$1.InvalidTorStateError();
            const circuit$1 = await this.#createCircuitOrThrow(signal);
            const material = bytes.Bytes.random(20);
            const create_fast = new cell$i.CreateFastCell(material);
            this.output.enqueue(cell$1.Cell.Circuitful.from(circuit$1, create_fast));
            const created_fast = await this.#waitCreatedFast(circuit$1, signal);
            const k0 = bytes.Bytes.concat([material, created_fast.fragment.material]);
            const result = await kdftor.KDFTorResult.computeOrThrow(k0);
            if (!bytes.Bytes.equals(result.keyHash, created_fast.fragment.derivative))
                throw new kdftor.InvalidKdfKeyHashError();
            const forwardDigest = sha1.Sha1.get().getOrThrow().Hasher.createOrThrow();
            const backwardDigest = sha1.Sha1.get().getOrThrow().Hasher.createOrThrow();
            forwardDigest.updateOrThrow(result.forwardDigest);
            backwardDigest.updateOrThrow(result.backwardDigest);
            const forwardKeyMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(result.forwardKey), false);
            const forwardIvMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(new Uint8Array(16)), false);
            const backwardKeyMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(result.backwardKey), false);
            const backwardIvMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(new Uint8Array(16)), false);
            const forwardKey = new index$1.Aes128Ctr128BEKey(forwardKeyMemory, forwardIvMemory);
            const backwardKey = new index$1.Aes128Ctr128BEKey(backwardKeyMemory, backwardIvMemory);
            const target$1 = new target.Target(this.#state.guard.identity, circuit$1, forwardDigest, backwardDigest, forwardKey, backwardKey);
            circuit$1.targets.push(target$1);
            return new circuit.Circuit(circuit$1);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            tslib_es6.__disposeResources(env_1);
        }
    }
}

exports.SecretTorClientDuplex = SecretTorClientDuplex;
exports.TorClientDuplex = TorClientDuplex;
//# sourceMappingURL=client.cjs.map
