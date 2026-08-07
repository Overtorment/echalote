import { Dates } from '../../../../../../libs/dates/dates.mjs';
import { Address4, Address6 } from '../../../address.mjs';
import { Unimplemented } from '../../../../errors.mjs';

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
        throw new Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new Unimplemented();
    }
    static readOrThrow(cursor) {
        const ipv4 = Address4.readOrThrow(cursor);
        if (ipv4.address !== "0.0.0.0") {
            const ttlv = cursor.readUint32OrThrow();
            const ttl = Dates.fromSecondsDelay(ttlv);
            return new _b(ipv4, ttl);
        }
        const type = cursor.readUint8OrThrow();
        if (type !== 6)
            throw new UnknownAddressType(type);
        const ipv6 = Address6.readOrThrow(cursor);
        const ttlv = cursor.readUint32OrThrow();
        const ttl = Dates.fromSecondsDelay(ttlv);
        return new _b(ipv6, ttl);
    }
}
_b = RelayConnectedCell;

export { RelayConnectedCell, UnknownAddressType };
//# sourceMappingURL=cell.mjs.map
