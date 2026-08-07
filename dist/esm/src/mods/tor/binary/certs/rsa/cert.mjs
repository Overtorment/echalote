import { X509 } from '@hazae41/x509';
import { ExpiredCertError, PrematureCertError } from '../../../certs/certs.mjs';

class RsaCert {
    type;
    data;
    x509;
    static types = {
        RSA_SELF: 2,
        RSA_TO_TLS: 1,
        RSA_TO_AUTH: 3
    };
    constructor(type, data, x509) {
        this.type = type;
        this.data = data;
        this.x509 = x509;
    }
    async sha1OrThrow() {
        const publicKey = X509.writeToBytesOrThrow(this.x509.tbsCertificate.subjectPublicKeyInfo);
        return new Uint8Array(await crypto.subtle.digest("SHA-1", publicKey));
    }
    verifyOrThrow() {
        const now = new Date();
        if (now > this.x509.tbsCertificate.validity.notAfter.value)
            throw new ExpiredCertError();
        if (now < this.x509.tbsCertificate.validity.notBefore.value)
            throw new PrematureCertError();
        return true;
    }
    sizeOrThrow() {
        return 1 + 2 + this.data.length;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.type);
        cursor.writeUint16OrThrow(this.data.length);
        cursor.writeOrThrow(this.data);
    }
    static readOrThrow(cursor) {
        const type = cursor.readUint8OrThrow();
        const length = cursor.readUint16OrThrow();
        const data = cursor.readAndCopyOrThrow(length);
        const x509 = X509.readAndResolveFromBytesOrThrow(X509.Certificate, data);
        return new RsaCert(type, data, x509);
    }
}

export { RsaCert };
//# sourceMappingURL=cert.mjs.map
