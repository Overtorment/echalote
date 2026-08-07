import { Writable, Opaque } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';

declare class RelayExtended2Cell<T extends Writable> {
    #private;
    readonly fragment: T;
    static readonly early = false;
    static readonly stream = false;
    static readonly rcommand = 15;
    constructor(fragment: T);
    get early(): false;
    get stream(): false;
    get rcommand(): 15;
    sizeOrThrow(): never;
    writeOrThrow(cursor: Cursor): never;
    static readOrThrow(cursor: Cursor): RelayExtended2Cell<Opaque<Uint8Array & {
        readonly length: number;
    }>>;
}

export { RelayExtended2Cell };
