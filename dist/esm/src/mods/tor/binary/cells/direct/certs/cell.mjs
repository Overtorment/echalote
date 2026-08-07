import { Readable } from '@hazae41/binary';
import { CrossCert } from '../../../certs/cross/cert.mjs';
import { Ed25519Cert } from '../../../certs/ed25519/cert.mjs';
import { RsaCert } from '../../../certs/rsa/cert.mjs';
import { DuplicatedCertError, UnknownCertError } from '../../../../certs/certs.mjs';
import { Unimplemented } from '../../../../errors.mjs';

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
        throw new Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new Unimplemented();
    }
    static readOrThrow(cursor) {
        const certs = {};
        const count = cursor.readUint8OrThrow();
        for (let i = 0; i < count; i++) {
            const offset = cursor.offset;
            const type = cursor.readUint8OrThrow();
            const length = cursor.readUint16OrThrow();
            cursor.offset = offset;
            const bytes = cursor.readOrThrow(1 + 2 + length);
            if (type === RsaCert.types.RSA_SELF) {
                if (certs.rsa_self != null)
                    throw new DuplicatedCertError();
                certs.rsa_self = Readable.readFromBytesOrThrow(RsaCert, bytes);
                continue;
            }
            if (type === RsaCert.types.RSA_TO_AUTH) {
                if (certs.rsa_to_auth != null)
                    throw new DuplicatedCertError();
                certs.rsa_to_auth = Readable.readFromBytesOrThrow(RsaCert, bytes);
                continue;
            }
            if (type === RsaCert.types.RSA_TO_TLS) {
                if (certs.rsa_to_tls != null)
                    throw new DuplicatedCertError();
                certs.rsa_to_tls = Readable.readFromBytesOrThrow(RsaCert, bytes);
                continue;
            }
            if (type === CrossCert.types.RSA_TO_ED) {
                if (certs.rsa_to_ed != null)
                    throw new DuplicatedCertError();
                certs.rsa_to_ed = Readable.readFromBytesOrThrow(CrossCert, bytes);
                continue;
            }
            if (type === Ed25519Cert.types.ED_TO_SIGN) {
                if (certs.ed_to_sign != null)
                    throw new DuplicatedCertError();
                certs.ed_to_sign = Readable.readFromBytesOrThrow(Ed25519Cert, bytes);
                continue;
            }
            if (type === Ed25519Cert.types.SIGN_TO_TLS) {
                if (certs.sign_to_tls != null)
                    throw new DuplicatedCertError();
                certs.sign_to_tls = Readable.readFromBytesOrThrow(Ed25519Cert, bytes);
                continue;
            }
            if (type === Ed25519Cert.types.SIGN_TO_AUTH) {
                if (certs.sign_to_auth != null)
                    throw new DuplicatedCertError();
                certs.sign_to_auth = Readable.readFromBytesOrThrow(Ed25519Cert, bytes);
                continue;
            }
            throw new UnknownCertError();
        }
        return new _a(certs);
    }
}
_a = CertsCell;

export { CertsCell };
//# sourceMappingURL=cell.mjs.map
