import { Dates } from '../../../../../../libs/dates/dates.mjs';
import { Address4, Address6 } from '../../../address.mjs';

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
        const ttlv = Dates.toSecondsDelay(this.ttl);
        cursor.writeUint32OrThrow(ttlv);
    }
    static readOrThrow(cursor) {
        const address = cursor.remaining === 8
            ? Address4.readOrThrow(cursor)
            : Address6.readOrThrow(cursor);
        const ttlv = cursor.readUint32OrThrow();
        const ttl = Dates.fromSecondsDelay(ttlv);
        return new _a(address, ttl);
    }
}
_a = RelayEndReasonExitPolicy;

export { RelayEndReasonExitPolicy, RelayEndReasonOther };
//# sourceMappingURL=reason.mjs.map
