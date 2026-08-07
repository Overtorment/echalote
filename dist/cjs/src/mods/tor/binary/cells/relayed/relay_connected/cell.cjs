'use strict';

var dates = require('../../../../../../libs/dates/dates.cjs');
var address = require('../../../address.cjs');
var errors = require('../../../../errors.cjs');

var _a, _b;
class UnknownAddressType extends Error {
    type;
    #class = _a;
    name = this.#class.name;
    constructor(type) {
        super(`Unknown address type ${type}`);
        this.type = type;
    }
}
_a = UnknownAddressType;
class RelayConnectedCell {
    address;
    ttl;
    #class = _b;
    static early = false;
    static stream = true;
    static rcommand = 4;
    constructor(address, ttl) {
        this.address = address;
        this.ttl = ttl;
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
        throw new errors.Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new errors.Unimplemented();
    }
    static readOrThrow(cursor) {
        const ipv4 = address.Address4.readOrThrow(cursor);
        if (ipv4.address !== "0.0.0.0") {
            const ttlv = cursor.readUint32OrThrow();
            const ttl = dates.Dates.fromSecondsDelay(ttlv);
            return new _b(ipv4, ttl);
        }
        const type = cursor.readUint8OrThrow();
        if (type !== 6)
            throw new UnknownAddressType(type);
        const ipv6 = address.Address6.readOrThrow(cursor);
        const ttlv = cursor.readUint32OrThrow();
        const ttl = dates.Dates.fromSecondsDelay(ttlv);
        return new _b(ipv6, ttl);
    }
}
_b = RelayConnectedCell;

exports.RelayConnectedCell = RelayConnectedCell;
exports.UnknownAddressType = UnknownAddressType;
//# sourceMappingURL=cell.cjs.map
