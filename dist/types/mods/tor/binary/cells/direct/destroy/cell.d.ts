import { Cursor } from '@hazae41/cursor';

declare namespace DestroyCell {
    type Reasons = typeof DestroyCell.reasons;
}
declare class DestroyCell {
    #private;
    readonly reason: number;
    static readonly old = false;
    static readonly circuit = true;
    static readonly command = 4;
    static readonly reasons: {
        readonly NONE: 0;
        readonly PROTOCOL: 1;
        readonly INTERNAL: 2;
        readonly REQUESTED: 3;
        readonly HIBERNATING: 4;
        readonly RESOURCELIMIT: 5;
        readonly CONNECTFAILED: 6;
        readonly OR_IDENTITY: 7;
        readonly CHANNEL_CLOSED: 8;
        readonly FINISHED: 9;
        readonly TIMEOUT: 10;
        readonly DESTROYED: 11;
        readonly NOSUCHSERVICE: 12;
    };
    constructor(reason: number);
    get command(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): DestroyCell;
}

export { DestroyCell };
