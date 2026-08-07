import { Writable, Opaque } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';

declare class RelayDropCell<T extends Writable> {
    #private;
    readonly fragment: T;
    static readonly early = false;
    static readonly stream = true;
    static readonly rcommand = 10;
    constructor(fragment: T);
    get early(): false;
    get stream(): true;
    get rcommand(): 10;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelayDropCell<Opaque<Uint8Array & {
        readonly length: number;
    }>>;
}

export { RelayDropCell };
