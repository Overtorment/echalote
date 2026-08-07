import { Cursor } from '@hazae41/cursor';
import { RelayEndReason } from './reason.js';

declare class RelayEndCell {
    #private;
    readonly reason: RelayEndReason;
    static readonly early = false;
    static readonly stream = true;
    static readonly rcommand = 3;
    static readonly reasons: {
        readonly REASON_UNKNOWN: 0;
        readonly REASON_MISC: 1;
        readonly REASON_RESOLVEFAILED: 2;
        readonly REASON_CONNECTREFUSED: 3;
        readonly REASON_EXITPOLICY: 4;
        readonly REASON_DESTROY: 5;
        readonly REASON_DONE: 6;
        readonly REASON_TIMEOUT: 7;
        readonly REASON_NOROUTE: 8;
        readonly REASON_HIBERNATING: 9;
        readonly REASON_INTERNAL: 10;
        readonly REASON_RESOURCELIMIT: 11;
        readonly REASON_CONNRESET: 12;
        readonly REASON_TORPROTOCOL: 13;
        readonly REASON_NOTDIRECTORY: 14;
    };
    constructor(reason: RelayEndReason);
    get early(): false;
    get stream(): true;
    get rcommand(): 3;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelayEndCell;
}

export { RelayEndCell };
