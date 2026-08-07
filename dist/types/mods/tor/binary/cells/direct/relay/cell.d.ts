import { Writable, Opaque, Readable } from '@hazae41/binary';
import { Uint8Array } from '@hazae41/bytes';
import { Cell } from '../../cell.js';
import { SecretCircuit } from '../../../../circuit.js';
import { SecretTorStreamDuplex } from '../../../../stream.js';

interface RelayCellable {
    readonly rcommand: number;
    readonly early: false;
    readonly stream: boolean;
}
declare namespace RelayCellable {
    interface Streamful {
        readonly rcommand: number;
        readonly early: false;
        readonly stream: true;
    }
    interface Streamless {
        readonly rcommand: number;
        readonly early: false;
        readonly stream: false;
    }
}
type RelayCell<T extends Writable> = RelayCell.Streamful<T> | RelayCell.Streamless<T>;
declare namespace RelayCell {
    const HEAD_LEN: number;
    const DATA_LEN: number;
    const command = 3;
    class Raw<T extends Writable> {
        readonly circuit: SecretCircuit;
        readonly stream: number;
        readonly rcommand: number;
        readonly fragment: T;
        readonly digest?: Uint8Array<20> | undefined;
        constructor(circuit: SecretCircuit, stream: number, rcommand: number, fragment: T, digest?: Uint8Array<20> | undefined);
        unpackOrNull(): Streamless<T> | Streamful<T> | undefined;
        cellOrThrow(): Cell.Circuitful<Opaque<globalThis.Uint8Array>>;
        static uncellOrThrow(cell: Cell<Opaque>): Raw<Opaque<globalThis.Uint8Array>>;
    }
    class Streamful<T extends Writable> {
        #private;
        readonly circuit: SecretCircuit;
        readonly stream: SecretTorStreamDuplex;
        readonly rcommand: number;
        readonly fragment: T;
        readonly digest?: Uint8Array<20> | undefined;
        constructor(circuit: SecretCircuit, stream: SecretTorStreamDuplex, rcommand: number, fragment: T, digest?: Uint8Array<20> | undefined);
        static from<T extends RelayCellable.Streamful & Writable>(circuit: SecretCircuit, stream: SecretTorStreamDuplex, fragment: T): Streamful<T>;
        cellOrThrow(): Cell.Circuitful<Opaque<globalThis.Uint8Array>>;
        static intoOrThrow<T extends Writable>(cell: RelayCell<Opaque>, readable: RelayCellable.Streamful & Readable<T>): Streamful<T>;
    }
    class Streamless<T extends Writable> {
        #private;
        readonly circuit: SecretCircuit;
        readonly stream: undefined;
        readonly rcommand: number;
        readonly fragment: T;
        readonly digest?: Uint8Array<20> | undefined;
        constructor(circuit: SecretCircuit, stream: undefined, rcommand: number, fragment: T, digest?: Uint8Array<20> | undefined);
        static from<T extends RelayCellable.Streamless & Writable>(circuit: SecretCircuit, stream: undefined, fragment: T): Streamless<T>;
        cellOrThrow(): Cell.Circuitful<Opaque>;
        static intoOrThrow<T extends Writable>(cell: RelayCell<Opaque>, readable: RelayCellable.Streamless & Readable<T>): Streamless<T>;
    }
}

export { RelayCell, RelayCellable };
