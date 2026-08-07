import { RelayEndReasonExitPolicy, RelayEndReasonOther } from './reason.mjs';

var _a;
class RelayEndCell {
    reason;
    #class = _a;
    static early = false;
    static stream = true;
    static rcommand = 3;
    static reasons = {
        REASON_UNKNOWN: 0,
        REASON_MISC: 1,
        REASON_RESOLVEFAILED: 2,
        REASON_CONNECTREFUSED: 3,
        REASON_EXITPOLICY: 4,
        REASON_DESTROY: 5,
        REASON_DONE: 6,
        REASON_TIMEOUT: 7,
        REASON_NOROUTE: 8,
        REASON_HIBERNATING: 9,
        REASON_INTERNAL: 10,
        REASON_RESOURCELIMIT: 11,
        REASON_CONNRESET: 12,
        REASON_TORPROTOCOL: 13,
        REASON_NOTDIRECTORY: 14,
    };
    constructor(reason) {
        this.reason = reason;
    }
    get early() {
        return this.#class.early;
    }
    get stream() {
        return this.#class.stream;
    }
    get rcommand() {
        return this.#class.rcommand;
    }
    sizeOrThrow() {
        return 1 + this.reason.sizeOrThrow();
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.reason.id);
        this.reason.writeOrThrow(cursor);
    }
    static readOrThrow(cursor) {
        const reasonId = cursor.readUint8OrThrow();
        const reason = reasonId === this.reasons.REASON_EXITPOLICY
            ? RelayEndReasonExitPolicy.readOrThrow(cursor)
            : new RelayEndReasonOther(reasonId);
        return new _a(reason);
    }
}
_a = RelayEndCell;

export { RelayEndCell };
//# sourceMappingURL=cell.mjs.map
