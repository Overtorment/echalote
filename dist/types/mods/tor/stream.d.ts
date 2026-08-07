import * as _hazae41_cascade from '@hazae41/cascade';
import { FullDuplex } from '@hazae41/cascade';
import { Opaque, Writable } from '@hazae41/binary';
import { SuperEventTarget, CloseEvents, ErrorEvents } from '@hazae41/plume';
import { SecretCircuit } from './circuit.js';
import { RelayEndReason } from './binary/cells/relayed/relay_end/reason.js';

declare class TorStreamDuplex {
    #private;
    constructor(secret: SecretTorStreamDuplex);
    [Symbol.dispose](): void;
    get id(): number;
    get type(): SecretTorStreamDuplexType;
    get inner(): ReadableWritablePair<Writable, Opaque<Uint8Array>>;
    get outer(): ReadableWritablePair<Opaque<Uint8Array>, Writable>;
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

export { RelayEndedError, SecretTorStreamDuplex, TorStreamDuplex };
export type { SecretTorStreamDuplexType, TorStreamEvents };
