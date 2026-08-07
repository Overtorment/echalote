import { Cursor } from '@hazae41/cursor';

declare class RelayTruncateCell {
    #private;
    readonly reason: number;
    static readonly early = false;
    static readonly stream = false;
    static readonly rcommand = 8;
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
    get early(): false;
    get stream(): false;
    get rcommand(): 8;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelayTruncateCell;
}

export { RelayTruncateCell };
