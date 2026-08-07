import { Writable, Opaque } from '@hazae41/binary';
import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';

declare class RelaySendmeCircuitCell<T extends Writable> {
    #private;
    readonly version: number;
    readonly fragment: T;
    static readonly early = false;
    static readonly stream = false;
    static readonly rcommand = 5;
    static readonly versions: {
        readonly 0: 0;
        readonly 1: 1;
    };
    constructor(version: number, fragment: T);
    get early(): false;
    get stream(): false;
    get rcommand(): 5;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelaySendmeCircuitCell<Opaque<globalThis.Uint8Array & {
        readonly length: number;
    }>>;
}
declare class RelaySendmeStreamCell {
    #private;
    static readonly early = false;
    static readonly stream = true;
    static readonly rcommand = 5;
    static readonly versions: {
        readonly 0: 0;
        readonly 1: 1;
    };
    constructor();
    get early(): false;
    get stream(): true;
    get rcommand(): 5;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelaySendmeStreamCell;
}
declare class RelaySendmeDigest {
    readonly digest: Uint8Array<20>;
    constructor(digest: Uint8Array<20>);
    sizeOrThrow(): 20;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelaySendmeDigest;
}

export { RelaySendmeCircuitCell, RelaySendmeDigest, RelaySendmeStreamCell };
