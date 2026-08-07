'use strict';

var tslib_es6 = require('../../../node_modules/tslib/tslib.es6.cjs');
var index$1 = require('../../libs/aes/index.cjs');
var base64 = require('@hazae41/base64');
var bitset = require('@hazae41/bitset');
var bytes = require('@hazae41/bytes');
var option = require('@hazae41/option');
var plume = require('@hazae41/plume');
var sha1 = require('@hazae41/sha1');
var x25519 = require('@hazae41/x25519');
var index = require('../console/index.cjs');
var ntor = require('./algorithms/ntor/ntor.cjs');
var cell = require('./binary/cells/direct/destroy/cell.cjs');
var cell$6 = require('./binary/cells/relayed/relay_begin/cell.cjs');
var cell$2 = require('./binary/cells/relayed/relay_extend2/cell.cjs');
var link = require('./binary/cells/relayed/relay_extend2/link.cjs');
var cell$1 = require('./binary/cells/relayed/relay_truncate/cell.cjs');
var stream = require('./stream.cjs');
var target = require('./target.cjs');
var cell$4 = require('./binary/cells/direct/relay/cell.cjs');
var cell$3 = require('./binary/cells/direct/relay_early/cell.cjs');
var cell$5 = require('./binary/cells/relayed/relay_begin_dir/cell.cjs');
var constants = require('./constants.cjs');

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
    events = new plume.SuperEventTarget();
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
    events = new plume.SuperEventTarget();
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
    async close(reason = cell.DestroyCell.reasons.NONE) {
        const error = new DestroyedError(reason);
        // TODO: send destroy cell
        this.#onCloseOrError(error);
        if (reason === cell.DestroyCell.reasons.NONE)
            await this.events.emit("close", [error]);
        else
            await this.events.emit("error", [error]);
    }
    async #onTorClose() {
        index.Console.debug(`${this.#class.name}.onTorClose`);
        this.#onCloseOrError();
        await this.events.emit("close", [undefined]);
    }
    async #onTorError(reason) {
        index.Console.debug(`${this.#class.name}.onReadError`, { reason });
        await this.events.emit("error", [reason]);
        this.#onCloseOrError(reason);
    }
    async #onDestroyCell(cell$1) {
        if (cell$1.circuit !== this)
            return;
        index.Console.debug(`${this.#class.name}.onDestroyCell`, cell$1);
        const error = new DestroyedError(cell$1.fragment.reason);
        this.#onCloseOrError(error);
        if (cell$1.fragment.reason === cell.DestroyCell.reasons.NONE)
            await this.events.emit("close", [error]);
        else
            await this.events.emit("error", [error]);
    }
    async #onRelayExtended2Cell(cell) {
        if (cell.circuit !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayExtended2Cell`, cell);
        await this.events.emit("RELAY_EXTENDED2", cell);
    }
    async #onRelayTruncatedCell(cell) {
        if (cell.circuit !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayTruncatedCell`, cell);
        const error = new DestroyedError(cell.fragment.reason);
        this.#onCloseOrError(error);
        if (cell.fragment.reason === cell$1.RelayTruncateCell.reasons.NONE)
            await this.events.emit("close", [error]);
        else
            await this.events.emit("error", [error]);
        await this.events.emit("RELAY_TRUNCATED", cell);
    }
    async #onRelayConnectedCell(cell) {
        if (cell.circuit !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayConnectedCell`, cell);
        await this.events.emit("RELAY_CONNECTED", cell);
    }
    async #onRelayDataCell(cell) {
        if (cell.circuit !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayDataCell`, cell);
        await this.events.emit("RELAY_DATA", cell);
    }
    async #onRelayEndCell(cell) {
        if (cell.circuit !== this)
            return;
        index.Console.debug(`${this.#class.name}.onRelayEndCell`, cell);
        this.streams.delete(cell.stream.id);
        await this.events.emit("RELAY_END", cell);
    }
    async extendOrThrow(microdesc, signal = new AbortController().signal) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            if (this.closed != null)
                throw this.closed.reason;
            const relayid_rsa_x = tslib_es6.__addDisposableResource(env_1, base64.Base64.get().getOrThrow().decodeUnpaddedOrThrow(microdesc.identity), false);
            const relayid_rsa = bytes.Bytes.castOrThrow(relayid_rsa_x.bytes.slice(), constants.HASH_LEN);
            const ntor_key_x = tslib_es6.__addDisposableResource(env_1, base64.Base64.get().getOrThrow().decodeUnpaddedOrThrow(microdesc.ntorOnionKey), false);
            const ntor_key = bytes.Bytes.castOrThrow(ntor_key_x.bytes.slice(), 32);
            const relayid_ed = option.Option.wrap(microdesc.idEd25519).mapSync(x => {
                const env_2 = { stack: [], error: void 0, hasError: false };
                try {
                    const memory = tslib_es6.__addDisposableResource(env_2, base64.Base64.get().getOrThrow().decodeUnpaddedOrThrow(x), false);
                    return memory.bytes.slice();
                }
                catch (e_2) {
                    env_2.error = e_2;
                    env_2.hasError = true;
                }
                finally {
                    tslib_es6.__disposeResources(env_2);
                }
            }).getOrNull();
            const links = new Array();
            links.push(new link.RelayExtend2LinkIPv4(microdesc.hostname, Number(microdesc.orport)));
            if (microdesc.ipv6 != null)
                links.push(link.RelayExtend2LinkIPv6.from(microdesc.ipv6));
            links.push(new link.RelayExtend2LinkLegacyID(relayid_rsa));
            if (relayid_ed != null)
                links.push(new link.RelayExtend2LinkModernID(relayid_ed));
            const wasm_secret_x = tslib_es6.__addDisposableResource(env_1, await x25519.X25519.get().getOrThrow().PrivateKey.randomOrThrow(), false);
            const wasm_public_x = tslib_es6.__addDisposableResource(env_1, wasm_secret_x.getPublicKeyOrThrow(), false);
            const public_x_memory = tslib_es6.__addDisposableResource(env_1, await wasm_public_x.exportOrThrow(), false);
            const public_x = bytes.Bytes.castOrThrow(public_x_memory.bytes.slice(), 32);
            const public_b = ntor_key;
            const ntor_request = new ntor.NtorRequest(public_x, relayid_rsa, public_b);
            const relay_extend2 = new cell$2.RelayExtend2Cell(cell$2.RelayExtend2Cell.types.NTOR, links, ntor_request);
            this.tor.output.enqueue(cell$3.RelayEarlyCell.Streamless.from(this, undefined, relay_extend2).cellOrThrow());
            const msg_extended2 = await plume.Plume.waitWithCloseAndErrorOrThrow(this.events, "RELAY_EXTENDED2", (future, e) => {
                future.resolve(e);
            }, signal);
            const response = msg_extended2.fragment.fragment.readIntoOrThrow(ntor.NtorResponse);
            const { public_y } = response;
            const wasm_public_y = tslib_es6.__addDisposableResource(env_1, await x25519.X25519.get().getOrThrow().PublicKey.importOrThrow(public_y), false);
            const wasm_public_b = tslib_es6.__addDisposableResource(env_1, await x25519.X25519.get().getOrThrow().PublicKey.importOrThrow(public_b), false);
            const wasm_shared_xy = tslib_es6.__addDisposableResource(env_1, await wasm_secret_x.computeOrThrow(wasm_public_y), false);
            const wasm_shared_xb = tslib_es6.__addDisposableResource(env_1, await wasm_secret_x.computeOrThrow(wasm_public_b), false);
            const shared_xy_memory = tslib_es6.__addDisposableResource(env_1, wasm_shared_xy.exportOrThrow(), false);
            const shared_xb_memory = tslib_es6.__addDisposableResource(env_1, wasm_shared_xb.exportOrThrow(), false);
            const shared_xy = bytes.Bytes.castOrThrow(shared_xy_memory.bytes.slice(), 32);
            const shared_xb = bytes.Bytes.castOrThrow(shared_xb_memory.bytes.slice(), 32);
            const result = await ntor.NtorResult.finalizeOrThrow(shared_xy, shared_xb, relayid_rsa, public_b, public_x, public_y);
            if (!bytes.Bytes.equals(response.auth, result.auth))
                throw new ntor.InvalidNtorAuthError();
            const forward_digest = sha1.Sha1.get().getOrThrow().Hasher.createOrThrow();
            const backward_digest = sha1.Sha1.get().getOrThrow().Hasher.createOrThrow();
            forward_digest.updateOrThrow(result.forwardDigest);
            backward_digest.updateOrThrow(result.backwardDigest);
            const forwardKeyMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(result.forwardKey), false);
            const forwardIvMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(new Uint8Array(16)), false);
            const backwardKeyMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(result.backwardKey), false);
            const backwardIvMemory = tslib_es6.__addDisposableResource(env_1, new index$1.AesWasm.Memory(new Uint8Array(16)), false);
            const forwardKey = new index$1.Aes128Ctr128BEKey(forwardKeyMemory, forwardIvMemory);
            const backwardKey = new index$1.Aes128Ctr128BEKey(backwardKeyMemory, backwardIvMemory);
            const target$1 = new target.Target(relayid_rsa, this, forward_digest, backward_digest, forwardKey, backwardKey);
            this.targets.push(target$1);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            tslib_es6.__disposeResources(env_1);
        }
    }
    async truncateOrThrow(reason = cell$1.RelayTruncateCell.reasons.NONE, signal = new AbortController().signal) {
        if (this.closed != null)
            throw this.closed.reason;
        const relay_truncate = new cell$1.RelayTruncateCell(reason);
        const relay_truncate_cell = cell$4.RelayCell.Streamless.from(this, undefined, relay_truncate);
        this.tor.output.enqueue(relay_truncate_cell.cellOrThrow());
        await plume.Plume.waitWithCloseAndErrorOrThrow(this.events, "RELAY_TRUNCATED", (future, e) => {
            future.resolve(e);
        }, signal);
    }
    async openDirOrThrow(params = {}, signal = new AbortController().signal) {
        if (this.closed != null)
            throw this.closed.reason;
        const stream$1 = new stream.SecretTorStreamDuplex("directory", this.#streamId++, this);
        this.streams.set(stream$1.id, stream$1);
        const begin = new cell$5.RelayBeginDirCell();
        const begin_cell = cell$4.RelayCell.Streamful.from(this, stream$1, begin);
        this.tor.output.enqueue(begin_cell.cellOrThrow());
        if (!params.wait)
            return new stream.TorStreamDuplex(stream$1);
        await plume.Plume.waitWithCloseAndErrorOrThrow(stream$1.events, "connected", (future) => {
            future.resolve();
        }, signal);
        return new stream.TorStreamDuplex(stream$1);
    }
    async openOrThrow(hostname, port, params = {}, signal = new AbortController().signal) {
        if (this.closed != null)
            throw this.closed.reason;
        const { ipv6 = "preferred" } = params;
        const stream$1 = new stream.SecretTorStreamDuplex("external", this.#streamId++, this);
        this.streams.set(stream$1.id, stream$1);
        const flags = new bitset.Bitset(0, 32)
            .setLE(cell$6.RelayBeginCell.flags.IPV6_OK, IPv6[ipv6] !== IPv6.never)
            .setLE(cell$6.RelayBeginCell.flags.IPV4_NOT_OK, IPv6[ipv6] === IPv6.always)
            .setLE(cell$6.RelayBeginCell.flags.IPV6_PREFER, IPv6[ipv6] > IPv6.avoided)
            .unsign()
            .value;
        const begin = cell$6.RelayBeginCell.create(`${hostname}:${port}`, flags);
        const begin_cell = cell$4.RelayCell.Streamful.from(this, stream$1, begin);
        this.tor.output.enqueue(begin_cell.cellOrThrow());
        if (!params.wait)
            return new stream.TorStreamDuplex(stream$1);
        await plume.Plume.waitWithCloseAndErrorOrThrow(stream$1.events, "connected", (future) => {
            future.resolve();
        }, signal);
        return new stream.TorStreamDuplex(stream$1);
    }
}
_f = SecretCircuit;

exports.Circuit = Circuit;
exports.DestroyedError = DestroyedError;
exports.ExtendError = ExtendError;
exports.IPv6 = IPv6;
exports.OpenError = OpenError;
exports.SecretCircuit = SecretCircuit;
exports.TruncateError = TruncateError;
exports.UnknownProtocolError = UnknownProtocolError;
//# sourceMappingURL=circuit.cjs.map
