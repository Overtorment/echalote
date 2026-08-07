import { Cursor } from '@hazae41/cursor';

declare class VariablePaddingCell {
    #private;
    readonly data: Uint8Array;
    static readonly circuit = false;
    static readonly command = 128;
    constructor(data: Uint8Array);
    get command(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): VariablePaddingCell;
}

export { VariablePaddingCell };
