import { Writable, Opaque, Readable } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';
import { SecretCircuit } from '../../circuit.js';
import { SecretTorClientDuplex } from '../../client.js';

interface Cellable {
    readonly old: false;
    readonly circuit: boolean;
    readonly command: number;
}
declare namespace Cellable {
    interface Circuitful {
        readonly old: false;
        readonly circuit: true;
        readonly command: number;
    }
    interface Circuitless {
        readonly old: false;
        readonly circuit: false;
        readonly command: number;
    }
}
type Cell<T extends Writable> = Cell.Circuitful<T> | Cell.Circuitless<T>;
declare namespace Cell {
    type PAYLOAD_LEN = 509;
    const PAYLOAD_LEN = 509;
    class Raw<T extends Writable> {
        readonly circuit: number;
        readonly command: number;
        readonly fragment: T;
        constructor(circuit: number, command: number, fragment: T);
        unpackOrNull(tor: SecretTorClientDuplex): Circuitless<T> | Circuitful<T> | undefined;
        sizeOrThrow(): number;
        writeOrThrow(cursor: Cursor): void;
        static readOrThrow(cursor: Cursor): Raw<Opaque<Uint8Array>>;
    }
    class Circuitful<T extends Writable> {
        #private;
        readonly circuit: SecretCircuit;
        readonly command: number;
        readonly fragment: T;
        constructor(circuit: SecretCircuit, command: number, fragment: T);
        static from<T extends Cellable.Circuitful & Writable>(circuit: SecretCircuit, cellable: T): Circuitful<T>;
        sizeOrThrow(): number;
        writeOrThrow(cursor: Cursor): void;
        static intoOrThrow<T extends Writable>(cell: Cell<Opaque>, readable: Cellable.Circuitful & Readable<T>): Circuitful<T>;
    }
    class Circuitless<T extends Writable> {
        #private;
        readonly circuit: undefined;
        readonly command: number;
        readonly fragment: T;
        constructor(circuit: undefined, command: number, fragment: T);
        static from<T extends Cellable.Circuitless & Writable>(circuit: undefined, cellable: T): Circuitless<T>;
        sizeOrThrow(): number;
        writeOrThrow(cursor: Cursor): void;
        static intoOrThrow<T extends Writable>(cell: Cell<Opaque>, readable: Cellable.Circuitless & Readable<T>): Circuitless<T>;
    }
}

export { Cell, Cellable };
