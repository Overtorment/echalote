import { Cursor } from '@hazae41/cursor';

declare class PaddingNegociateCell {
    #private;
    readonly version: number;
    readonly pcommand: number;
    readonly ito_low_ms: number;
    readonly ito_high_ms: number;
    static readonly old = false;
    static readonly circuit = false;
    static readonly command = 12;
    static readonly versions: {
        readonly ZERO: 0;
    };
    static readonly commands: {
        readonly STOP: 1;
        readonly START: 2;
    };
    constructor(version: number, pcommand: number, ito_low_ms: number, ito_high_ms: number);
    get old(): false;
    get circuit(): false;
    get command(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): PaddingNegociateCell;
}

export { PaddingNegociateCell };
