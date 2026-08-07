import * as _hazae41_cascade from '@hazae41/cascade';
import { FullDuplex } from '@hazae41/cascade';
import { Opaque, Writable } from '@hazae41/binary';
import { SuperEventTarget, CloseEvents, ErrorEvents } from '@hazae41/plume';
import { SecretCircuit } from './circuit.js';
import { RelayEndReason } from './binary/cells/relayed/relay_end/reason.js';

/**
 * Wrap a Uint8Array duplex as hazae41 Opaque/Writable (Cadenas TLS, Fleche, …).
 */
declare function asOpaqueDuplex(bytes: ReadableWritablePair<Uint8Array, Uint8Array>): ReadableWritablePair<Opaque, Writable>;
declare class TorStreamDuplex {
    #private;
    constructor(secret: SecretTorStreamDuplex);
    [Symbol.dispose](): void;
    get id(): number;
    get type(): SecretTorStreamDuplexType;
    /** Raw byte duplex (Uint8Array in, Uint8Array out). */
    get outer(): ReadableWritablePair<Uint8Array, Uint8Array>;
    error(reason?: unknown): void;
    close(): void;
}
declare class RelayEndedError extends Error {
    #private;
    readonly reason: RelayEndReason;
    readonly name: string;
    constructor(reason: RelayEndReason);
}
type TorStreamEvents = CloseEvents & ErrorEvents & {
    connected: () => void;
};
type SecretTorStreamDuplexType = "external" | "directory";
declare class SecretTorStreamDuplex {
    #private;
    readonly type: SecretTorStreamDuplexType;
    readonly id: number;
    readonly circuit: SecretCircuit;
    readonly duplex: FullDuplex<Opaque, Writable>;
    readonly events: SuperEventTarget<TorStreamEvents>;
    delivery: number;
    package: number;
    constructor(type: SecretTorStreamDuplexType, id: number, circuit: SecretCircuit);
    [Symbol.dispose](): void;
    get inner(): ReadableWritablePair<Writable, Opaque<Uint8Array>>;
    get outer(): ReadableWritablePair<Opaque<Uint8Array>, Writable>;
    get input(): _hazae41_cascade.Simplex<Opaque<Uint8Array>, Opaque<Uint8Array>>;
    get output(): _hazae41_cascade.Simplex<Writable, Writable>;
    get closed(): {
        reason?: undefined;
    } | undefined;
    close(): void;
    error(reason?: unknown): void;
}

export { RelayEndedError, SecretTorStreamDuplex, TorStreamDuplex, asOpaqueDuplex };
export type { SecretTorStreamDuplexType, TorStreamEvents };
