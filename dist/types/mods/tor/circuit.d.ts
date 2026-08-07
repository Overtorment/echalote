import { Opaque } from '@hazae41/binary';
import { Plume, CloseEvents, ErrorEvents } from '@hazae41/plume';
import { RelayDataCell } from './binary/cells/relayed/relay_data/cell.js';
import { RelayEndCell } from './binary/cells/relayed/relay_end/cell.js';
import { RelayExtended2Cell } from './binary/cells/relayed/relay_extended2/cell.js';
import { RelayTruncatedCell } from './binary/cells/relayed/relay_truncated/cell.js';
import { SecretTorClientDuplex } from './client.js';
import { SecretTorStreamDuplex, TorStreamDuplex } from './stream.js';
import { Target } from './target.js';
import { RelayCell } from './binary/cells/direct/relay/cell.js';
import { Consensus } from './consensus/consensus.js';

declare const IPv6: {
    readonly always: 3;
    readonly preferred: 2;
    readonly avoided: 1;
    readonly never: 0;
};
interface CircuitOpenParams {
    /**
     * Wait RELAY_CONNECTED
     */
    readonly wait?: boolean;
    /**
     * IPv6 preference
     */
    readonly ipv6?: keyof typeof IPv6;
}
declare class UnknownProtocolError extends Error {
    #private;
    readonly protocol: string;
    readonly name: string;
    constructor(protocol: string);
}
declare class DestroyedError extends Error {
    #private;
    readonly reason: number;
    readonly name: string;
    constructor(reason: number);
}
declare class ExtendError extends Error {
    #private;
    readonly name: string;
    constructor(options: ErrorOptions);
    static from(cause: unknown): ExtendError;
}
declare class OpenError extends Error {
    #private;
    readonly name: string;
    constructor(options: ErrorOptions);
    static from(cause: unknown): OpenError;
}
declare class TruncateError extends Error {
    #private;
    readonly name: string;
    constructor(options: ErrorOptions);
    static from(cause: unknown): TruncateError;
}
declare class Circuit {
    #private;
    readonly events: Plume.SuperEventTarget<CloseEvents & ErrorEvents>;
    constructor(secret: SecretCircuit);
    [Symbol.dispose](): void;
    [Symbol.asyncDispose](): Promise<void>;
    get id(): number;
    get closed(): boolean;
    extendOrThrow(microdesc: Consensus.Microdesc, signal?: AbortSignal): Promise<void>;
    openOrThrow(hostname: string, port: number, params?: CircuitOpenParams, signal?: AbortSignal): Promise<TorStreamDuplex>;
    openDirOrThrow(params?: CircuitOpenParams, signal?: AbortSignal): Promise<TorStreamDuplex>;
    close(): Promise<void>;
}
type SecretCircuitEvents = CloseEvents & ErrorEvents & {
    /**
     * Streamless
     */
    "RELAY_EXTENDED2": (cell: RelayCell.Streamless<RelayExtended2Cell<Opaque>>) => void;
    "RELAY_TRUNCATED": (cell: RelayCell.Streamless<RelayTruncatedCell>) => void;
    /**
     * Streamful
     */
    "RELAY_CONNECTED": (cell: RelayCell.Streamful<Opaque>) => void;
    "RELAY_DATA": (cell: RelayCell.Streamful<RelayDataCell<Opaque>>) => void;
    "RELAY_END": (cell: RelayCell.Streamful<RelayEndCell>) => void;
};
declare class SecretCircuit {
    #private;
    readonly id: number;
    readonly tor: SecretTorClientDuplex;
    readonly events: Plume.SuperEventTarget<SecretCircuitEvents>;
    readonly targets: Target[];
    readonly streams: Map<number, SecretTorStreamDuplex>;
    constructor(id: number, tor: SecretTorClientDuplex);
    [Symbol.dispose](): void;
    [Symbol.asyncDispose](): Promise<void>;
    get closed(): {
        reason?: unknown;
    } | undefined;
    close(reason?: number): Promise<void>;
    extendOrThrow(microdesc: Consensus.Microdesc, signal?: AbortSignal): Promise<void>;
    truncateOrThrow(reason?: number, signal?: AbortSignal): Promise<void>;
    openDirOrThrow(params?: CircuitOpenParams, signal?: AbortSignal): Promise<TorStreamDuplex>;
    openOrThrow(hostname: string, port: number, params?: CircuitOpenParams, signal?: AbortSignal): Promise<TorStreamDuplex>;
}

export { Circuit, DestroyedError, ExtendError, IPv6, OpenError, SecretCircuit, TruncateError, UnknownProtocolError };
export type { CircuitOpenParams, SecretCircuitEvents };
