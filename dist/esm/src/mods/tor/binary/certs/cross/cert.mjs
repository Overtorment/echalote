import { ExpiredCertError } from '../../../certs/certs.mjs';
import { Unimplemented } from '../../../errors.mjs';

var _a;
class CrossCert {
    type;
    key;
    expiration;
    payload;
    signature;
    #class = _a;
    static types = {
        RSA_TO_ED: 7
    };
    constructor(type, key, expiration, payload, signature) {
        this.type = type;
        this.key = key;
        this.expiration = expiration;
        this.payload = payload;
        this.signature = signature;
    }
    verifyOrThrow() {
        const now = new Date();
        if (now > this.expiration)
            throw new ExpiredCertError();
        return true;
    }
    sizeOrThrow() {
        throw new Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new Unimplemented();
    }
    static readOrThrow(cursor) {
        const type = cursor.readUint8OrThrow();
        cursor.readUint16OrThrow(); // TODO: check length
        const start = cursor.offset;
        const key = cursor.readAndCopyOrThrow(32);
        const expDateHours = cursor.readUint32OrThrow();
        const expiration = new Date(expDateHours * 60 * 60 * 1000);
        const content = cursor.offset - start;
        cursor.offset = start;
        const payload = cursor.readAndCopyOrThrow(content);
        const sigLength = cursor.readUint8OrThrow();
        const signature = cursor.readAndCopyOrThrow(sigLength);
        return new _a(type, key, expiration, payload, signature);
    }
}
_a = CrossCert;

export { CrossCert };
//# sourceMappingURL=cert.mjs.map
