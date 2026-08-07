import { __addDisposableResource, __disposeResources } from '../../../node_modules/tslib/tslib.es6.mjs';
import { AesWasm, Aes128Ctr128BEKey } from '../../libs/aes/index.mjs';
import { Readable } from '@hazae41/binary';
import { Bitset } from '@hazae41/bitset';
import { Bytes } from '@hazae41/bytes';
import { Ciphers, TlsClientDuplex } from '@hazae41/cadenas';
import { HalfDuplex } from '@hazae41/cascade';
import { Cursor } from '@hazae41/cursor';
import { Future } from '@hazae41/future';
import { Mutex } from '@hazae41/mutex';
import { SuperEventTarget, Plume } from '@hazae41/plume';
import { RsaWasm } from '../../libs/rsa/index.mjs';
import { Sha1 } from '@hazae41/sha1';
import { Resizer } from '../../libs/resizer/resizer.mjs';
import { Console } from '../console/index.mjs';
import { initBundledCrypto } from '../crypto/init.mjs';
import { TypedAddress } from './binary/address.mjs';
import { Cell } from './binary/cells/cell.mjs';
import { AuthChallengeCell } from './binary/cells/direct/auth_challenge/cell.mjs';
import { CertsCell } from './binary/cells/direct/certs/cell.mjs';
import { CreateFastCell } from './binary/cells/direct/create_fast/cell.mjs';
import { CreatedFastCell } from './binary/cells/direct/created_fast/cell.mjs';
import { DestroyCell } from './binary/cells/direct/destroy/cell.mjs';
import { NetinfoCell } from './binary/cells/direct/netinfo/cell.mjs';
import { PaddingCell } from './binary/cells/direct/padding/cell.mjs';
import { PaddingNegociateCell } from './binary/cells/direct/padding_negociate/cell.mjs';
import { RelayCell } from './binary/cells/direct/relay/cell.mjs';
import { VersionsCell } from './binary/cells/direct/versions/cell.mjs';
import { VariablePaddingCell } from './binary/cells/direct/vpadding/cell.mjs';
import { RelayConnectedCell } from './binary/cells/relayed/relay_connected/cell.mjs';
import { RelayDataCell } from './binary/cells/relayed/relay_data/cell.mjs';
import { RelayDropCell } from './binary/cells/relayed/relay_drop/cell.mjs';
import { RelayEndCell } from './binary/cells/relayed/relay_end/cell.mjs';
import { RelayExtended2Cell } from './binary/cells/relayed/relay_extended2/cell.mjs';
import { RelayTruncatedCell } from './binary/cells/relayed/relay_truncated/cell.mjs';
import { SecretCircuit, Circuit } from './circuit.mjs';
import { Target } from './target.mjs';
import { KDFTorResult, InvalidKdfKeyHashError } from './algorithms/kdftor.mjs';
import { InvalidCellError, ExpectedStreamError, InvalidRelayCellDigestError, InvalidRelaySendmeCellDigestError } from './binary/cells/errors.mjs';
import { OldCell } from './binary/cells/old.mjs';
import { RelaySendmeCircuitCell, RelaySendmeStreamCell, RelaySendmeDigest } from './binary/cells/relayed/relay_sendme/cell.mjs';
import { Certs } from './certs/certs.mjs';
import { InvalidTorVersionError, InvalidTorStateError } from './errors.mjs';

class TorClientDuplex {
    #secret;
    events = new SuperEventTarget();
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
    ciphers = [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384];
    tls;
    duplex;
    events = new SuperEventTarget();
    circuits = new Mutex(new Map());
    #buffer = new Resizer();
    #resolveOnStart = new Future();
    #resolveOnTlsCertificates = new Future();
    #state = { type: "none" };
    constructor() {
        this.tls = new TlsClientDuplex({
            /**
             * Do not validate root certificates
             */
            authorized: true,
            ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384],
            certificates: c => this.#resolveOnTlsCertificates.resolve(c)
        });
        this.duplex = new HalfDuplex({
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
        await initBundledCrypto();
        await RsaWasm.initBundled();
        await AesWasm.initBundled();
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
        this.output.enqueue(OldCell.Circuitless.from(undefined, new VersionsCell([5])));
        await Plume.waitWithCloseAndErrorOrThrow(this.events, "handshaked", (future) => future.resolve());
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
        const cursor = new Cursor(chunk);
        while (cursor.remaining) {
            let raw;
            try {
                raw = this.#state.type === "none"
                    ? Readable.readOrRollbackAndThrow(OldCell.Raw, cursor)
                    : Readable.readOrRollbackAndThrow(Cell.Raw, cursor);
            }
            catch (e) {
                this.#buffer.writeOrThrow(cursor.after);
                break;
            }
            const cell = raw.unpackOrNull(this);
            if (cell == null)
                continue;
            await this.#onCell(cell, this.#state);
        }
    }
    async #onCell(cell, state) {
        if (cell.command === PaddingCell.command) {
            Console.debug(cell);
            return;
        }
        if (cell.command === VariablePaddingCell.command) {
            Console.debug(cell);
            return;
        }
        if (state.type === "none")
            return await this.#onNoneStateCell(cell, state);
        if (cell instanceof OldCell.Circuitful)
            throw new InvalidCellError();
        if (cell instanceof OldCell.Circuitless)
            throw new InvalidCellError();
        if (state.type === "versioned")
            return await this.#onVersionedStateCell(cell, state);
        if (state.type === "handshaking")
            return await this.#onHandshakingStateCell(cell, state);
        if (state.type === "handshaked")
            return await this.#onHandshakedStateCell(cell);
        return state;
    }
    async #onNoneStateCell(cell, state) {
        if (cell instanceof Cell.Circuitful)
            throw new InvalidCellError();
        if (cell instanceof Cell.Circuitless)
            throw new InvalidCellError();
        if (cell.command === VersionsCell.command)
            return await this.#onVersionsCell(cell, state);
        console.warn(`Unknown pre-version cell ${cell.command}`);
    }
    async #onVersionedStateCell(cell, state) {
        if (cell.command === CertsCell.command)
            return await this.#onCertsCell(cell, state);
        console.warn(`Unknown versioned-state cell ${cell.command}`);
    }
    async #onHandshakingStateCell(cell, state) {
        if (cell.command === AuthChallengeCell.command)
            return await this.#onAuthChallengeCell(cell, state);
        if (cell.command === NetinfoCell.command)
            return await this.#onNetinfoCell(cell, state);
        console.warn(`Unknown handshaking-state cell ${cell.command}`);
    }
    async #onHandshakedStateCell(cell) {
        if (cell.command === CreatedFastCell.command)
            return await this.#onCreatedFastCell(cell);
        if (cell.command === DestroyCell.command)
            return await this.#onDestroyCell(cell);
        if (cell.command === RelayCell.command)
            return await this.#onRelayCell(cell);
        console.warn(`Unknown handshaked-state cell ${cell.command}`);
    }
    async #onVersionsCell(cell, state) {
        const cell2 = OldCell.Circuitless.intoOrThrow(cell, VersionsCell);
        Console.debug(cell2);
        if (!cell2.fragment.versions.includes(5))
            throw new InvalidTorVersionError();
        this.#state = { ...state, type: "versioned", version: 5 };
    }
    async #onCertsCell(cell, state) {
        const cell2 = Cell.Circuitless.intoOrThrow(cell, CertsCell);
        Console.debug(cell2);
        const tlsCerts = await this.#resolveOnTlsCertificates.promise;
        const torCerts = await Certs.verifyOrThrow(cell2.fragment.certs, tlsCerts);
        const identity = await torCerts.rsa_self.sha1OrThrow();
        const guard = { certs: torCerts, identity };
        this.#state = { ...state, type: "handshaking", guard };
    }
    async #onAuthChallengeCell(cell, state) {
        Console.debug(Cell.Circuitless.intoOrThrow(cell, AuthChallengeCell));
    }
    async #onNetinfoCell(cell, state) {
        const cell2 = Cell.Circuitless.intoOrThrow(cell, NetinfoCell);
        Console.debug(cell2);
        const address = new TypedAddress(4, new Uint8Array([127, 0, 0, 1]));
        const netinfo = new NetinfoCell(0, address, []);
        this.output.enqueue(Cell.Circuitless.from(undefined, netinfo));
        const pversion = PaddingNegociateCell.versions.ZERO;
        const pcommand = PaddingNegociateCell.commands.STOP;
        const padding_negociate = new PaddingNegociateCell(pversion, pcommand, 0, 0);
        this.output.enqueue(Cell.Circuitless.from(undefined, padding_negociate));
        this.#state = { ...state, type: "handshaked" };
        await this.events.emit("handshaked");
    }
    async #onCreatedFastCell(cell) {
        const cell2 = Cell.Circuitful.intoOrThrow(cell, CreatedFastCell);
        Console.debug(cell2);
        await this.events.emit("CREATED_FAST", cell2);
    }
    async #onDestroyCell(cell) {
        const cell2 = Cell.Circuitful.intoOrThrow(cell, DestroyCell);
        Console.debug(cell2);
        this.circuits.inner.delete(cell2.circuit.id);
        await this.events.emit("DESTROY", cell2);
    }
    async #onRelayCell(parent) {
        const raw = RelayCell.Raw.uncellOrThrow(parent);
        const cell = raw.unpackOrNull();
        if (cell == null)
            return;
        if (cell.rcommand === RelayExtended2Cell.rcommand)
            return await this.#onRelayExtended2Cell(cell);
        if (cell.rcommand === RelayConnectedCell.rcommand)
            return await this.#onRelayConnectedCell(cell);
        if (cell.rcommand === RelayDataCell.rcommand)
            return await this.#onRelayDataCell(cell);
        if (cell.rcommand === RelayEndCell.rcommand)
            return await this.#onRelayEndCell(cell);
        if (cell.rcommand === RelayDropCell.rcommand)
            return await this.#onRelayDropCell(cell);
        if (cell.rcommand === RelayTruncatedCell.rcommand)
            return await this.#onRelayTruncatedCell(cell);
        if (cell.rcommand === RelaySendmeCircuitCell.rcommand && cell.stream == null)
            return await this.#onRelaySendmeCircuitCell(cell);
        if (cell.rcommand === RelaySendmeStreamCell.rcommand && cell.stream != null)
            return await this.#onRelaySendmeStreamCell(cell);
        console.warn(`Unknown relay cell ${cell.rcommand}`);
    }
    async #onRelayExtended2Cell(cell) {
        const cell2 = RelayCell.Streamless.intoOrThrow(cell, RelayExtended2Cell);
        Console.debug(cell2);
        await this.events.emit("RELAY_EXTENDED2", cell2);
    }
    async #onRelayConnectedCell(cell) {
        if (cell.stream == null)
            throw new ExpectedStreamError();
        await this.events.emit("RELAY_CONNECTED", cell);
    }
    async #onRelayDataCell(cell) {
        const cell2 = RelayCell.Streamful.intoOrThrow(cell, RelayDataCell);
        Console.debug(cell2);
        const exit = cell2.circuit.targets[cell2.circuit.targets.length - 1];
        exit.delivery--;
        if (exit.delivery === 900) {
            exit.delivery = 1000;
            if (cell2.digest == null)
                throw new InvalidRelayCellDigestError();
            const digest = new RelaySendmeDigest(cell2.digest);
            const sendme = new RelaySendmeCircuitCell(1, digest);
            const sendme_cell = RelayCell.Streamless.from(cell2.circuit, undefined, sendme);
            this.output.enqueue(sendme_cell.cellOrThrow());
        }
        await this.events.emit("RELAY_DATA", cell2);
    }
    async #onRelayEndCell(cell) {
        const cell2 = RelayCell.Streamful.intoOrThrow(cell, RelayEndCell);
        Console.debug(cell2);
        await this.events.emit("RELAY_END", cell2);
    }
    async #onRelayDropCell(cell) {
        Console.debug(RelayCell.Streamful.intoOrThrow(cell, RelayDropCell));
    }
    async #onRelayTruncatedCell(cell) {
        const cell2 = RelayCell.Streamless.intoOrThrow(cell, RelayTruncatedCell);
        Console.debug(cell2);
        cell2.circuit.targets.pop();
        await this.events.emit("RELAY_TRUNCATED", cell2);
    }
    async #onRelaySendmeCircuitCell(cell) {
        const cell2 = RelayCell.Streamless.intoOrThrow(cell, RelaySendmeCircuitCell);
        Console.debug(cell2);
        if (cell2.fragment.version === 0) {
            const exit = cell2.circuit.targets[cell2.circuit.targets.length - 1];
            exit.package += 100;
            return;
        }
        if (cell2.fragment.version === 1) {
            const digest = cell2.fragment.fragment.readIntoOrThrow(RelaySendmeDigest);
            Console.debug(digest);
            const exit = cell2.circuit.targets[cell2.circuit.targets.length - 1];
            const digest2 = exit.digests.shift();
            if (digest2 == null)
                throw new InvalidRelaySendmeCellDigestError();
            if (!Bytes.equals(digest.digest, digest2))
                throw new InvalidRelaySendmeCellDigestError();
            exit.package += 100;
            return;
        }
        console.warn(`Unknown RELAY_SENDME circuit cell version ${cell2.fragment.version}`);
    }
    async #onRelaySendmeStreamCell(cell) {
        const cell2 = RelayCell.Streamful.intoOrThrow(cell, RelaySendmeStreamCell);
        Console.debug(cell2);
        cell2.stream.package += 50;
    }
    async waitOrThrow(signal = new AbortController().signal) {
        if (this.state.type === "handshaked")
            return;
        await Plume.waitWithCloseAndErrorOrThrow(this.events, "handshaked", (future) => future.resolve(), signal);
    }
    async #createCircuitOrThrow(signal = new AbortController().signal) {
        return await this.circuits.runOrWait((circuits) => {
            while (!signal.aborted) {
                const rawCircuitId = new Cursor(Bytes.random(4)).getUint32OrThrow();
                if (rawCircuitId === 0)
                    continue;
                const circuitId = new Bitset(rawCircuitId, 32)
                    .enableBE(0)
                    .unsign()
                    .value;
                if (circuits.has(circuitId))
                    continue;
                const circuit = new SecretCircuit(circuitId, this);
                circuits.set(circuitId, circuit);
                return circuit;
            }
            throw new Error("Aborted", { cause: signal.reason });
        });
    }
    async #waitCreatedFast(circuit, signal = new AbortController().signal) {
        return await Plume.waitWithCloseAndErrorOrThrow(this.events, "CREATED_FAST", async (future, e) => {
            if (e.circuit !== circuit)
                return;
            future.resolve(e);
        }, signal);
    }
    async createOrThrow(signal = new AbortController().signal) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            if (this.#state.type !== "handshaked")
                throw new InvalidTorStateError();
            const circuit = await this.#createCircuitOrThrow(signal);
            const material = Bytes.random(20);
            const create_fast = new CreateFastCell(material);
            this.output.enqueue(Cell.Circuitful.from(circuit, create_fast));
            const created_fast = await this.#waitCreatedFast(circuit, signal);
            const k0 = Bytes.concat([material, created_fast.fragment.material]);
            const result = await KDFTorResult.computeOrThrow(k0);
            if (!Bytes.equals(result.keyHash, created_fast.fragment.derivative))
                throw new InvalidKdfKeyHashError();
            const forwardDigest = Sha1.get().getOrThrow().Hasher.createOrThrow();
            const backwardDigest = Sha1.get().getOrThrow().Hasher.createOrThrow();
            forwardDigest.updateOrThrow(result.forwardDigest);
            backwardDigest.updateOrThrow(result.backwardDigest);
            const forwardKeyMemory = __addDisposableResource(env_1, new AesWasm.Memory(result.forwardKey), false);
            const forwardIvMemory = __addDisposableResource(env_1, new AesWasm.Memory(new Uint8Array(16)), false);
            const backwardKeyMemory = __addDisposableResource(env_1, new AesWasm.Memory(result.backwardKey), false);
            const backwardIvMemory = __addDisposableResource(env_1, new AesWasm.Memory(new Uint8Array(16)), false);
            const forwardKey = new Aes128Ctr128BEKey(forwardKeyMemory, forwardIvMemory);
            const backwardKey = new Aes128Ctr128BEKey(backwardKeyMemory, backwardIvMemory);
            const target = new Target(this.#state.guard.identity, circuit, forwardDigest, backwardDigest, forwardKey, backwardKey);
            circuit.targets.push(target);
            return new Circuit(circuit);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
}

export { SecretTorClientDuplex, TorClientDuplex };
//# sourceMappingURL=client.mjs.map
