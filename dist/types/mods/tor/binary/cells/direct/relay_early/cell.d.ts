import { Writable, Opaque, Readable } from '@hazae41/binary';
import { Cell } from '../../cell.js';
import { SecretCircuit } from '../../../../circuit.js';
import { SecretTorStreamDuplex } from '../../../../stream.js';

interface RelayEarlyCellable {
    readonly rcommand: number;
    readonly early: true;
    readonly stream: boolean;
}
declare namespace RelayEarlyCellable {
    interface Streamful {
        readonly rcommand: number;
        readonly early: true;
        readonly stream: true;
    }
    interface Streamless {
        readonly rcommand: number;
        readonly early: true;
        readonly stream: false;
    }
}
type RelayEarlyCell<T extends Writable> = RelayEarlyCell.Streamful<T> | RelayEarlyCell.Streamless<T>;
declare namespace RelayEarlyCell {
    const HEAD_LEN: number;
    const DATA_LEN: number;
    const command = 9;
    class Raw<T extends Writable> {
        readonly circuit: SecretCircuit;
        readonly stream: number;
        readonly rcommand: number;
        readonly fragment: T;
        constructor(circuit: SecretCircuit, stream: number, rcommand: number, fragment: T);
        unpackOrThrow(): Streamless<T> | Streamful<T>;
        cellOrThrow(): Cell.Circuitful<Opaque<Uint8Array>>;
        static uncellOrThrow(cell: Cell<Opaque>): Raw<Opaque<Uint8Array>>;
    }
    class Streamful<T extends Writable> {
        #private;
        readonly circuit: SecretCircuit;
        readonly stream: SecretTorStreamDuplex;
        readonly rcommand: number;
        readonly fragment: T;
        constructor(circuit: SecretCircuit, stream: SecretTorStreamDuplex, rcommand: number, fragment: T);
        static from<T extends RelayEarlyCellable.Streamful & Writable>(circuit: SecretCircuit, stream: SecretTorStreamDuplex, fragment: T): Streamful<T>;
        cellOrThrow(): Cell.Circuitful<Opaque<Uint8Array>>;
        static intoOrThrow<T extends Writable>(cell: RelayEarlyCell<Opaque>, readable: RelayEarlyCellable.Streamful & Readable<T>): Streamful<T>;
    }
    class Streamless<T extends Writable> {
        #private;
        readonly circuit: SecretCircuit;
        readonly stream: undefined;
        readonly rcommand: number;
        readonly fragment: T;
        constructor(circuit: SecretCircuit, stream: undefined, rcommand: number, fragment: T);
        static from<T extends RelayEarlyCellable.Streamless & Writable>(circuit: SecretCircuit, stream: undefined, fragment: T): Streamless<T>;
        cellOrThrow(): Cell.Circuitful<Opaque<Uint8Array>>;
        static intoOrThrow<T extends Writable>(cell: RelayEarlyCell<Opaque>, readable: RelayEarlyCellable.Streamless & Readable<T>): Streamless<T>;
    }
}

export { RelayEarlyCell, RelayEarlyCellable };
