import { __addDisposableResource, __disposeResources } from '../../../node_modules/tslib/tslib.es6.mjs';
import { AesWasm, Aes128Ctr128BEKey } from '../../libs/aes/index.mjs';
import { Base64 } from '@hazae41/base64';
import { Bitset } from '@hazae41/bitset';
import { Bytes } from '@hazae41/bytes';
import { Option } from '@hazae41/option';
import { SuperEventTarget, Plume } from '@hazae41/plume';
import { Sha1 } from '@hazae41/sha1';
import { X25519 } from '@hazae41/x25519';
import { Console } from '../console/index.mjs';
import { NtorRequest, NtorResponse, NtorResult, InvalidNtorAuthError } from './algorithms/ntor/ntor.mjs';
import { DestroyCell } from './binary/cells/direct/destroy/cell.mjs';
import { RelayBeginCell } from './binary/cells/relayed/relay_begin/cell.mjs';
import { RelayExtend2Cell } from './binary/cells/relayed/relay_extend2/cell.mjs';
import { RelayExtend2LinkIPv4, RelayExtend2LinkIPv6, RelayExtend2LinkLegacyID, RelayExtend2LinkModernID } from './binary/cells/relayed/relay_extend2/link.mjs';
import { RelayTruncateCell } from './binary/cells/relayed/relay_truncate/cell.mjs';
import { SecretTorStreamDuplex, TorStreamDuplex } from './stream.mjs';
import { Target } from './target.mjs';
import { RelayCell } from './binary/cells/direct/relay/cell.mjs';
import { RelayEarlyCell } from './binary/cells/direct/relay_early/cell.mjs';
import { RelayBeginDirCell } from './binary/cells/relayed/relay_begin_dir/cell.mjs';
import { HASH_LEN } from './constants.mjs';

var _a, _b, _c, _d, _e, _f;
const IPv6 = {
    always: 3,
    preferred: 2,
    avoided: 1,
    never: 0
};
class UnknownProtocolError extends Error {
    protocol;
    #class = _a;
    name = this.#class.name;
    constructor(protocol) {
        super(`Unknown protocol "${protocol}"`);
        this.protocol = protocol;
    }
}
_a = UnknownProtocolError;
class DestroyedError extends Error {
    reason;
    #class = _b;
    name = this.#class.name;
    constructor(reason) {
        super(`Circuit destroyed`, { cause: reason });
        this.reason = reason;
    }
}
_b = DestroyedError;
class ExtendError extends Error {
    #class = _c;
    name = this.#class.name;
    constructor(options) {
        super(`Could not extend`, options);
    }
    static from(cause) {
        return new _c({ cause });
    }
}
_c = ExtendError;
class OpenError extends Error {
    #class = _d;
    name = this.#class.name;
    constructor(options) {
        super(`Could not open`, options);
    }
    static from(cause) {
        return new _d({ cause });
    }
}
_d = OpenError;
class TruncateError extends Error {
    #class = _e;
    name = this.#class.name;
    constructor(options) {
        super(`Could not truncate`, options);
    }
    static from(cause) {
        return new _e({ cause });
    }
}
_e = TruncateError;
class Circuit {
    events = new SuperEventTarget();
    #secret;
    constructor(secret) {
        this.#secret = secret;
        const onClose = this.#onClose.bind(this);
        this.#secret.events.on("close", onClose);
        const onError = this.#onError.bind(this);
        this.#secret.events.on("error", onError);
    }
    [Symbol.dispose]() {
        this.#secret[Symbol.dispose]();
    }
    async [Symbol.asyncDispose]() {
        this.#secret[Symbol.asyncDispose]();
    }
    get id() {
        return this.#secret.id;
    }
    get closed() {
        return Boolean(this.#secret.closed);
    }
    async #onClose() {
        return await this.events.emit("close", [undefined]);
    }
    async #onError(reason) {
        return await this.events.emit("error", [reason]);
    }
    async extendOrThrow(microdesc, signal = new AbortController().signal) {
        return await this.#secret.extendOrThrow(microdesc, signal);
    }
    async openOrThrow(hostname, port, params, signal = new AbortController().signal) {
        return await this.#secret.openOrThrow(hostname, port, params, signal);
    }
    async openDirOrThrow(params, signal = new AbortController().signal) {
        return await this.#secret.openDirOrThrow(params, signal);
    }
    async close() {
        return await this.#secret.close();
    }
}
class SecretCircuit {
    id;
    tor;
    #class = _f;
    events = new SuperEventTarget();
    targets = new Array();
    streams = new Map();
    #streamId = 1;
    #closed;
    #onClean;
    constructor(id, tor) {
        this.id = id;
        this.tor = tor;
        const onClose = this.#onTorClose.bind(this);
        const onError = this.#onTorError.bind(this);
        const onDestroyCell = this.#onDestroyCell.bind(this);
        const onRelayExtended2Cell = this.#onRelayExtended2Cell.bind(this);
        const onRelayTruncatedCell = this.#onRelayTruncatedCell.bind(this);
        const onRelayConnectedCell = this.#onRelayConnectedCell.bind(this);
        const onRelayDataCell = this.#onRelayDataCell.bind(this);
        const onRelayEndCell = this.#onRelayEndCell.bind(this);
        this.tor.events.on("close", onClose, { passive: true });
        this.tor.events.on("error", onError, { passive: true });
        this.tor.events.on("DESTROY", onDestroyCell, { passive: true });
        this.tor.events.on("RELAY_EXTENDED2", onRelayExtended2Cell, { passive: true });
        this.tor.events.on("RELAY_TRUNCATED", onRelayTruncatedCell, { passive: true });
        this.tor.events.on("RELAY_CONNECTED", onRelayConnectedCell, { passive: true });
        this.tor.events.on("RELAY_DATA", onRelayDataCell, { passive: true });
        this.tor.events.on("RELAY_END", onRelayEndCell, { passive: true });
        this.#onClean = () => {
            for (const stream of this.streams.values())
                stream[Symbol.dispose]();
            for (const target of this.targets)
                target[Symbol.dispose]();
            this.tor.events.off("close", onClose);
            this.tor.events.off("error", onError);
            this.tor.events.off("DESTROY", onDestroyCell);
            this.tor.events.off("RELAY_EXTENDED2", onRelayExtended2Cell);
            this.tor.events.off("RELAY_TRUNCATED", onRelayTruncatedCell);
            this.tor.events.off("RELAY_CONNECTED", onRelayConnectedCell);
            this.tor.events.off("RELAY_DATA", onRelayDataCell);
            this.tor.events.off("RELAY_END", onRelayEndCell);
            this.tor.circuits.inner.delete(this.id);
            this.#onClean = () => { };
        };
    }
    [Symbol.dispose]() {
        this.close().catch(console.error);
    }
    async [Symbol.asyncDispose]() {
        await this.close();
    }
    get closed() {
        return this.#closed;
    }
    #onCloseOrError(reason) {
        if (this.#closed)
            return;
        this.#closed = { reason };
        this.#onClean();
    }
    async close(reason = DestroyCell.reasons.NONE) {
        const error = new DestroyedError(reason);
        // TODO: send destroy cell
        this.#onCloseOrError(error);
        if (reason === DestroyCell.reasons.NONE)
            await this.events.emit("close", [error]);
        else
            await this.events.emit("error", [error]);
    }
    async #onTorClose() {
        Console.debug(`${this.#class.name}.onTorClose`);
        this.#onCloseOrError();
        await this.events.emit("close", [undefined]);
    }
    async #onTorError(reason) {
        Console.debug(`${this.#class.name}.onReadError`, { reason });
        await this.events.emit("error", [reason]);
        this.#onCloseOrError(reason);
    }
    async #onDestroyCell(cell) {
        if (cell.circuit !== this)
            return;
        Console.debug(`${this.#class.name}.onDestroyCell`, cell);
        const error = new DestroyedError(cell.fragment.reason);
        this.#onCloseOrError(error);
        if (cell.fragment.reason === DestroyCell.reasons.NONE)
            await this.events.emit("close", [error]);
        else
            await this.events.emit("error", [error]);
    }
    async #onRelayExtended2Cell(cell) {
        if (cell.circuit !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayExtended2Cell`, cell);
        await this.events.emit("RELAY_EXTENDED2", cell);
    }
    async #onRelayTruncatedCell(cell) {
        if (cell.circuit !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayTruncatedCell`, cell);
        const error = new DestroyedError(cell.fragment.reason);
        this.#onCloseOrError(error);
        if (cell.fragment.reason === RelayTruncateCell.reasons.NONE)
            await this.events.emit("close", [error]);
        else
            await this.events.emit("error", [error]);
        await this.events.emit("RELAY_TRUNCATED", cell);
    }
    async #onRelayConnectedCell(cell) {
        if (cell.circuit !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayConnectedCell`, cell);
        await this.events.emit("RELAY_CONNECTED", cell);
    }
    async #onRelayDataCell(cell) {
        if (cell.circuit !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayDataCell`, cell);
        await this.events.emit("RELAY_DATA", cell);
    }
    async #onRelayEndCell(cell) {
        if (cell.circuit !== this)
            return;
        Console.debug(`${this.#class.name}.onRelayEndCell`, cell);
        this.streams.delete(cell.stream.id);
        await this.events.emit("RELAY_END", cell);
    }
    async extendOrThrow(microdesc, signal = new AbortController().signal) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            if (this.closed != null)
                throw this.closed.reason;
            const relayid_rsa_x = __addDisposableResource(env_1, Base64.get().getOrThrow().decodeUnpaddedOrThrow(microdesc.identity), false);
            const relayid_rsa = Bytes.castOrThrow(relayid_rsa_x.bytes.slice(), HASH_LEN);
            const ntor_key_x = __addDisposableResource(env_1, Base64.get().getOrThrow().decodeUnpaddedOrThrow(microdesc.ntorOnionKey), false);
            const ntor_key = Bytes.castOrThrow(ntor_key_x.bytes.slice(), 32);
            const relayid_ed = Option.wrap(microdesc.idEd25519).mapSync(x => {
                const env_2 = { stack: [], error: void 0, hasError: false };
                try {
                    const memory = __addDisposableResource(env_2, Base64.get().getOrThrow().decodeUnpaddedOrThrow(x), false);
                    return memory.bytes.slice();
                }
                catch (e_2) {
                    env_2.error = e_2;
                    env_2.hasError = true;
                }
                finally {
                    __disposeResources(env_2);
                }
            }).getOrNull();
            const links = new Array();
            links.push(new RelayExtend2LinkIPv4(microdesc.hostname, Number(microdesc.orport)));
            if (microdesc.ipv6 != null)
                links.push(RelayExtend2LinkIPv6.from(microdesc.ipv6));
            links.push(new RelayExtend2LinkLegacyID(relayid_rsa));
            if (relayid_ed != null)
                links.push(new RelayExtend2LinkModernID(relayid_ed));
            const wasm_secret_x = __addDisposableResource(env_1, await X25519.get().getOrThrow().PrivateKey.randomOrThrow(), false);
            const wasm_public_x = __addDisposableResource(env_1, wasm_secret_x.getPublicKeyOrThrow(), false);
            const public_x_memory = __addDisposableResource(env_1, await wasm_public_x.exportOrThrow(), false);
            const public_x = Bytes.castOrThrow(public_x_memory.bytes.slice(), 32);
            const public_b = ntor_key;
            const ntor_request = new NtorRequest(public_x, relayid_rsa, public_b);
            const relay_extend2 = new RelayExtend2Cell(RelayExtend2Cell.types.NTOR, links, ntor_request);
            this.tor.output.enqueue(RelayEarlyCell.Streamless.from(this, undefined, relay_extend2).cellOrThrow());
            const msg_extended2 = await Plume.waitWithCloseAndErrorOrThrow(this.events, "RELAY_EXTENDED2", (future, e) => {
                future.resolve(e);
            }, signal);
            const response = msg_extended2.fragment.fragment.readIntoOrThrow(NtorResponse);
            const { public_y } = response;
            const wasm_public_y = __addDisposableResource(env_1, await X25519.get().getOrThrow().PublicKey.importOrThrow(public_y), false);
            const wasm_public_b = __addDisposableResource(env_1, await X25519.get().getOrThrow().PublicKey.importOrThrow(public_b), false);
            const wasm_shared_xy = __addDisposableResource(env_1, await wasm_secret_x.computeOrThrow(wasm_public_y), false);
            const wasm_shared_xb = __addDisposableResource(env_1, await wasm_secret_x.computeOrThrow(wasm_public_b), false);
            const shared_xy_memory = __addDisposableResource(env_1, wasm_shared_xy.exportOrThrow(), false);
            const shared_xb_memory = __addDisposableResource(env_1, wasm_shared_xb.exportOrThrow(), false);
            const shared_xy = Bytes.castOrThrow(shared_xy_memory.bytes.slice(), 32);
            const shared_xb = Bytes.castOrThrow(shared_xb_memory.bytes.slice(), 32);
            const result = await NtorResult.finalizeOrThrow(shared_xy, shared_xb, relayid_rsa, public_b, public_x, public_y);
            if (!Bytes.equals(response.auth, result.auth))
                throw new InvalidNtorAuthError();
            const forward_digest = Sha1.get().getOrThrow().Hasher.createOrThrow();
            const backward_digest = Sha1.get().getOrThrow().Hasher.createOrThrow();
            forward_digest.updateOrThrow(result.forwardDigest);
            backward_digest.updateOrThrow(result.backwardDigest);
            const forwardKeyMemory = __addDisposableResource(env_1, new AesWasm.Memory(result.forwardKey), false);
            const forwardIvMemory = __addDisposableResource(env_1, new AesWasm.Memory(new Uint8Array(16)), false);
            const backwardKeyMemory = __addDisposableResource(env_1, new AesWasm.Memory(result.backwardKey), false);
            const backwardIvMemory = __addDisposableResource(env_1, new AesWasm.Memory(new Uint8Array(16)), false);
            const forwardKey = new Aes128Ctr128BEKey(forwardKeyMemory, forwardIvMemory);
            const backwardKey = new Aes128Ctr128BEKey(backwardKeyMemory, backwardIvMemory);
            const target = new Target(relayid_rsa, this, forward_digest, backward_digest, forwardKey, backwardKey);
            this.targets.push(target);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
    async truncateOrThrow(reason = RelayTruncateCell.reasons.NONE, signal = new AbortController().signal) {
        if (this.closed != null)
            throw this.closed.reason;
        const relay_truncate = new RelayTruncateCell(reason);
        const relay_truncate_cell = RelayCell.Streamless.from(this, undefined, relay_truncate);
        this.tor.output.enqueue(relay_truncate_cell.cellOrThrow());
        await Plume.waitWithCloseAndErrorOrThrow(this.events, "RELAY_TRUNCATED", (future, e) => {
            future.resolve(e);
        }, signal);
    }
    async openDirOrThrow(params = {}, signal = new AbortController().signal) {
        if (this.closed != null)
            throw this.closed.reason;
        const stream = new SecretTorStreamDuplex("directory", this.#streamId++, this);
        this.streams.set(stream.id, stream);
        const begin = new RelayBeginDirCell();
        const begin_cell = RelayCell.Streamful.from(this, stream, begin);
        this.tor.output.enqueue(begin_cell.cellOrThrow());
        if (!params.wait)
            return new TorStreamDuplex(stream);
        await Plume.waitWithCloseAndErrorOrThrow(stream.events, "connected", (future) => {
            future.resolve();
        }, signal);
        return new TorStreamDuplex(stream);
    }
    async openOrThrow(hostname, port, params = {}, signal = new AbortController().signal) {
        if (this.closed != null)
            throw this.closed.reason;
        const { ipv6 = "preferred" } = params;
        const stream = new SecretTorStreamDuplex("external", this.#streamId++, this);
        this.streams.set(stream.id, stream);
        const flags = new Bitset(0, 32)
            .setLE(RelayBeginCell.flags.IPV6_OK, IPv6[ipv6] !== IPv6.never)
            .setLE(RelayBeginCell.flags.IPV4_NOT_OK, IPv6[ipv6] === IPv6.always)
            .setLE(RelayBeginCell.flags.IPV6_PREFER, IPv6[ipv6] > IPv6.avoided)
            .unsign()
            .value;
        const begin = RelayBeginCell.create(`${hostname}:${port}`, flags);
        const begin_cell = RelayCell.Streamful.from(this, stream, begin);
        this.tor.output.enqueue(begin_cell.cellOrThrow());
        if (!params.wait)
            return new TorStreamDuplex(stream);
        await Plume.waitWithCloseAndErrorOrThrow(stream.events, "connected", (future) => {
            future.resolve();
        }, signal);
        return new TorStreamDuplex(stream);
    }
}
_f = SecretCircuit;

export { Circuit, DestroyedError, ExtendError, IPv6, OpenError, SecretCircuit, TruncateError, UnknownProtocolError };
//# sourceMappingURL=circuit.mjs.map
