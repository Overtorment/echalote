import { Cursor } from '@hazae41/cursor';

declare class VersionsCell {
    #private;
    readonly versions: number[];
    static readonly old = true;
    static readonly circuit = false;
    static readonly command = 7;
    constructor(versions: number[]);
    get old(): true;
    get circuit(): false;
    get command(): 7;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): VersionsCell;
}

export { VersionsCell };
