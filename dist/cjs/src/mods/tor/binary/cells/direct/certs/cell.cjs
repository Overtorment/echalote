'use strict';

var binary = require('@hazae41/binary');
var cert$1 = require('../../../certs/cross/cert.cjs');
var cert$2 = require('../../../certs/ed25519/cert.cjs');
var cert = require('../../../certs/rsa/cert.cjs');
var certs = require('../../../../certs/certs.cjs');
var errors = require('../../../../errors.cjs');

var _a;
class CertsCell {
    certs;
    #class = _a;
    static old = false;
    static circuit = false;
    static command = 129;
    constructor(certs) {
        this.certs = certs;
    }
    get circuit() {
        return this.#class.circuit;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        throw new errors.Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new errors.Unimplemented();
    }
    static readOrThrow(cursor) {
        const certs$1 = {};
        const count = cursor.readUint8OrThrow();
        for (let i = 0; i < count; i++) {
            const offset = cursor.offset;
            const type = cursor.readUint8OrThrow();
            const length = cursor.readUint16OrThrow();
            cursor.offset = offset;
            const bytes = cursor.readOrThrow(1 + 2 + length);
            if (type === cert.RsaCert.types.RSA_SELF) {
                if (certs$1.rsa_self != null)
                    throw new certs.DuplicatedCertError();
                certs$1.rsa_self = binary.Readable.readFromBytesOrThrow(cert.RsaCert, bytes);
                continue;
            }
            if (type === cert.RsaCert.types.RSA_TO_AUTH) {
                if (certs$1.rsa_to_auth != null)
                    throw new certs.DuplicatedCertError();
                certs$1.rsa_to_auth = binary.Readable.readFromBytesOrThrow(cert.RsaCert, bytes);
                continue;
            }
            if (type === cert.RsaCert.types.RSA_TO_TLS) {
                if (certs$1.rsa_to_tls != null)
                    throw new certs.DuplicatedCertError();
                certs$1.rsa_to_tls = binary.Readable.readFromBytesOrThrow(cert.RsaCert, bytes);
                continue;
            }
            if (type === cert$1.CrossCert.types.RSA_TO_ED) {
                if (certs$1.rsa_to_ed != null)
                    throw new certs.DuplicatedCertError();
                certs$1.rsa_to_ed = binary.Readable.readFromBytesOrThrow(cert$1.CrossCert, bytes);
                continue;
            }
            if (type === cert$2.Ed25519Cert.types.ED_TO_SIGN) {
                if (certs$1.ed_to_sign != null)
                    throw new certs.DuplicatedCertError();
                certs$1.ed_to_sign = binary.Readable.readFromBytesOrThrow(cert$2.Ed25519Cert, bytes);
                continue;
            }
            if (type === cert$2.Ed25519Cert.types.SIGN_TO_TLS) {
                if (certs$1.sign_to_tls != null)
                    throw new certs.DuplicatedCertError();
                certs$1.sign_to_tls = binary.Readable.readFromBytesOrThrow(cert$2.Ed25519Cert, bytes);
                continue;
            }
            if (type === cert$2.Ed25519Cert.types.SIGN_TO_AUTH) {
                if (certs$1.sign_to_auth != null)
                    throw new certs.DuplicatedCertError();
                certs$1.sign_to_auth = binary.Readable.readFromBytesOrThrow(cert$2.Ed25519Cert, bytes);
                continue;
            }
            throw new certs.UnknownCertError();
        }
        return new _a(certs$1);
    }
}
_a = CertsCell;

exports.CertsCell = CertsCell;
//# sourceMappingURL=cell.cjs.map
