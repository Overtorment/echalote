import { Cursor } from '@hazae41/cursor';

declare class RelayBeginDirCell {
    #private;
    static readonly early = false;
    static readonly stream = true;
    static readonly rcommand = 13;
    constructor();
    get early(): false;
    get stream(): true;
    get rcommand(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}

export { RelayBeginDirCell };
