import * as _hazae41_cascade from '@hazae41/cascade';
import { HalfDuplex } from '@hazae41/cascade';
import * as _hazae41_cadenas from '@hazae41/cadenas';
import { TlsClientDuplex } from '@hazae41/cadenas';
import { Opaque, Writable } from '@hazae41/binary';
import { Uint8Array } from '@hazae41/bytes';
import { Mutex } from '@hazae41/mutex';
import { Plume, CloseEvents, ErrorEvents } from '@hazae41/plume';
import { Cell } from './binary/cells/cell.js';
import { CreatedFastCell } from './binary/cells/direct/created_fast/cell.js';
import { DestroyCell } from './binary/cells/direct/destroy/cell.js';
import { RelayCell } from './binary/cells/direct/relay/cell.js';
import { RelayDataCell } from './binary/cells/relayed/relay_data/cell.js';
import { RelayEndCell } from './binary/cells/relayed/relay_end/cell.js';
import { RelayExtended2Cell } from './binary/cells/relayed/relay_extended2/cell.js';
import { RelayTruncatedCell } from './binary/cells/relayed/relay_truncated/cell.js';
import { SecretCircuit, Circuit } from './circuit.js';
import { Certs } from './certs/certs.js';
import { TorState } from './state.js';

interface Guard {
    readonly identity: Uint8Array<20>;
    readonly certs: Certs;
}
type TorClientDuplexEvents = CloseEvents & ErrorEvents;
declare class TorClientDuplex {
    #private;
    readonly events: Plume.SuperEventTarget<TorClientDuplexEvents>;
    constructor();
    [Symbol.dispose](): void;
    get inner(): ReadableWritablePair<Writable, Opaque<globalThis.Uint8Array>>;
    get outer(): ReadableWritablePair<Opaque<globalThis.Uint8Array>, Writable>;
    get closing(): {
        reason?: undefined;
    } | undefined;
    get closed(): {
        reason?: undefined;
    } | undefined;
    error(reason?: unknown): void;
    close(): void;
    waitOrThrow(signal?: AbortSignal): Promise<void>;
    createOrThrow(signal?: AbortSignal): Promise<Circuit>;
}
type SecretTorEvents = CloseEvents & ErrorEvents & {
    handshaked: () => void;
} & {
    "CREATED_FAST": (cell: Cell.Circuitful<CreatedFastCell>) => void;
    "DESTROY": (cell: Cell.Circuitful<DestroyCell>) => void;
    "RELAY_CONNECTED": (cell: RelayCell.Streamful<Opaque>) => void;
    "RELAY_DATA": (cell: RelayCell.Streamful<RelayDataCell<Opaque>>) => void;
    "RELAY_EXTENDED2": (cell: RelayCell.Streamless<RelayExtended2Cell<Opaque>>) => void;
    "RELAY_TRUNCATED": (cell: RelayCell.Streamless<RelayTruncatedCell>) => void;
    "RELAY_END": (cell: RelayCell.Streamful<RelayEndCell>) => void;
};
declare class SecretTorClientDuplex {
    #private;
    readonly ciphers: _hazae41_cadenas.Cipher[];
    readonly tls: TlsClientDuplex;
    readonly duplex: HalfDuplex<Opaque, Writable>;
    readonly events: Plume.SuperEventTarget<SecretTorEvents>;
    readonly circuits: Mutex<Map<number, SecretCircuit>>;
    constructor();
    [Symbol.dispose](): void;
    get state(): TorState;
    /**
     * TLS inner pair
     */
    get inner(): ReadableWritablePair<Writable, Opaque<globalThis.Uint8Array>>;
    get outer(): ReadableWritablePair<Opaque<globalThis.Uint8Array>, Writable>;
    get input(): _hazae41_cascade.Simplex<Opaque<globalThis.Uint8Array>, Opaque<globalThis.Uint8Array>>;
    get output(): _hazae41_cascade.Simplex<Writable, Writable>;
    get closing(): {
        reason?: undefined;
    } | undefined;
    get closed(): {
        reason?: undefined;
    } | undefined;
    error(reason?: unknown): void;
    close(): void;
    waitOrThrow(signal?: AbortSignal): Promise<void>;
    createOrThrow(signal?: AbortSignal): Promise<Circuit>;
}

export { SecretTorClientDuplex, TorClientDuplex };
export type { Guard, SecretTorEvents, TorClientDuplexEvents };
