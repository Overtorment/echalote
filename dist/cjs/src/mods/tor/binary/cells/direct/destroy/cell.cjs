'use strict';

var _a;
class DestroyCell {
    reason;
    #class = _a;
    static old = false;
    static circuit = true;
    static command = 4;
    static reasons = {
        NONE: 0,
        PROTOCOL: 1,
        INTERNAL: 2,
        REQUESTED: 3,
        HIBERNATING: 4,
        RESOURCELIMIT: 5,
        CONNECTFAILED: 6,
        OR_IDENTITY: 7,
        CHANNEL_CLOSED: 8,
        FINISHED: 9,
        TIMEOUT: 10,
        DESTROYED: 11,
        NOSUCHSERVICE: 12
    };
    constructor(reason) {
        this.reason = reason;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        return 1;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.reason);
    }
    static readOrThrow(cursor) {
        const code = cursor.readUint8OrThrow();
        cursor.offset += cursor.remaining;
        return new _a(code);
    }
}
_a = DestroyCell;

exports.DestroyCell = DestroyCell;
//# sourceMappingURL=cell.cjs.map
