'use strict';

var x509 = require('@hazae41/x509');
var certs = require('../../../certs/certs.cjs');

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
        const publicKey = x509.X509.writeToBytesOrThrow(this.x509.tbsCertificate.subjectPublicKeyInfo);
        return new Uint8Array(await crypto.subtle.digest("SHA-1", publicKey));
    }
    verifyOrThrow() {
        const now = new Date();
        if (now > this.x509.tbsCertificate.validity.notAfter.value)
            throw new certs.ExpiredCertError();
        if (now < this.x509.tbsCertificate.validity.notBefore.value)
            throw new certs.PrematureCertError();
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
        const x509$1 = x509.X509.readAndResolveFromBytesOrThrow(x509.X509.Certificate, data);
        return new RsaCert(type, data, x509$1);
    }
}

exports.RsaCert = RsaCert;
//# sourceMappingURL=cert.cjs.map
