'use strict';

var dates = require('../../../../../../libs/dates/dates.cjs');
var address = require('../../../address.cjs');

var _a;
class RelayEndReasonOther {
    id;
    constructor(id) {
        this.id = id;
    }
    sizeOrThrow() {
        return 0;
    }
    writeOrThrow(cursor) {
        return;
    }
}
class RelayEndReasonExitPolicy {
    address;
    ttl;
    #class = _a;
    static id = 4;
    constructor(address, ttl) {
        this.address = address;
        this.ttl = ttl;
    }
    get id() {
        return this.#class.id;
    }
    sizeOrThrow() {
        return this.address.sizeOrThrow() + 4;
    }
    writeOrThrow(cursor) {
        this.address.writeOrThrow(cursor);
        const ttlv = dates.Dates.toSecondsDelay(this.ttl);
        cursor.writeUint32OrThrow(ttlv);
    }
    static readOrThrow(cursor) {
        const address$1 = cursor.remaining === 8
            ? address.Address4.readOrThrow(cursor)
            : address.Address6.readOrThrow(cursor);
        const ttlv = cursor.readUint32OrThrow();
        const ttl = dates.Dates.fromSecondsDelay(ttlv);
        return new _a(address$1, ttl);
    }
}
_a = RelayEndReasonExitPolicy;

exports.RelayEndReasonExitPolicy = RelayEndReasonExitPolicy;
exports.RelayEndReasonOther = RelayEndReasonOther;
//# sourceMappingURL=reason.cjs.map
