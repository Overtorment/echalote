import { Cursor } from '@hazae41/cursor';

declare class PaddingCell {
    #private;
    readonly data: Uint8Array;
    static readonly circuit = false;
    static readonly command = 0;
    constructor(data: Uint8Array);
    get command(): number;
    sizeOrThrow(): never;
    writeOrThrow(cursor: Cursor): never;
    static readOrThrow(cursor: Cursor): PaddingCell;
}

export { PaddingCell };
