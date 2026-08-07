import { Cursor } from '@hazae41/cursor';

declare class RelayBeginCell {
    #private;
    readonly address: string;
    readonly bytes: Uint8Array;
    readonly flags: number;
    static readonly early = false;
    static readonly stream = true;
    static readonly rcommand = 1;
    static readonly flags: {
        readonly IPV6_OK: 0;
        readonly IPV4_NOT_OK: 1;
        readonly IPV6_PREFER: 2;
    };
    private constructor();
    static create(address: string, flags: number): RelayBeginCell;
    get early(): false;
    get stream(): true;
    get rcommand(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelayBeginCell;
}

export { RelayBeginCell };
