import { __addDisposableResource, __disposeResources } from '../../../../../../node_modules/tslib/tslib.es6.mjs';
import { Ed25519 } from '@hazae41/ed25519';
import { SignedWithEd25519Key } from './extensions/signer.mjs';
import { ExpiredCertError, InvalidSignatureError } from '../../../certs/certs.mjs';

var _a;
class UnknownCertExtensionError extends Error {
    type;
    #class = _a;
    name = this.#class.name;
    constructor(type) {
        super(`Unknown certificate extension ${type}`);
        this.type = type;
    }
}
_a = UnknownCertExtensionError;
class Ed25519Cert {
    type;
    version;
    certType;
    expiration;
    certKeyType;
    certKey;
    extensions;
    payload;
    signature;
    static types = {
        ED_TO_SIGN: 4,
        SIGN_TO_TLS: 5,
        SIGN_TO_AUTH: 6,
    };
    static flags = {
        AFFECTS_VALIDATION: 1
    };
    constructor(type, version, certType, expiration, certKeyType, certKey, extensions, payload, signature) {
        this.type = type;
        this.version = version;
        this.certType = certType;
        this.expiration = expiration;
        this.certKeyType = certKeyType;
        this.certKey = certKey;
        this.extensions = extensions;
        this.payload = payload;
        this.signature = signature;
    }
    async verifyOrThrow() {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const now = new Date();
            if (now > this.expiration)
                throw new ExpiredCertError();
            if (!this.extensions.signer)
                return true; // TODO maybe do additionnal check?
            const signer = __addDisposableResource(env_1, await Ed25519.get().getOrThrow().VerifyingKey.importOrThrow(this.extensions.signer.key), false);
            const signature = __addDisposableResource(env_1, Ed25519.get().getOrThrow().Signature.importOrThrow(this.signature), false);
            const verified = await signer.verifyOrThrow(this.payload, signature);
            if (verified !== true)
                throw new InvalidSignatureError();
            return true;
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
    static readOrThrow(cursor) {
        const type = cursor.readUint8OrThrow();
        cursor.readUint16OrThrow(); // TODO check length
        const start = cursor.offset;
        const version = cursor.readUint8OrThrow();
        const certType = cursor.readUint8OrThrow();
        const expDateHours = cursor.readUint32OrThrow();
        const expiration = new Date(expDateHours * 60 * 60 * 1000);
        const certKeyType = cursor.readUint8OrThrow();
        const certKey = cursor.readAndCopyOrThrow(32);
        const nextensions = cursor.readUint8OrThrow();
        const extensions = {};
        for (let i = 0; i < nextensions; i++) {
            const length = cursor.readUint16OrThrow();
            const type = cursor.readUint8OrThrow();
            const flags = cursor.readUint8OrThrow();
            if (type === SignedWithEd25519Key.type) {
                extensions.signer = SignedWithEd25519Key.readOrThrow(cursor);
                continue;
            }
            if (flags === this.flags.AFFECTS_VALIDATION)
                throw new UnknownCertExtensionError(type);
            cursor.readOrThrow(length);
        }
        const content = cursor.offset - start;
        cursor.offset = start;
        const payload = cursor.readAndCopyOrThrow(content);
        const signature = cursor.readAndCopyOrThrow(64);
        return new Ed25519Cert(type, version, certType, expiration, certKeyType, certKey, extensions, payload, signature);
    }
}

export { Ed25519Cert, UnknownCertExtensionError };
//# sourceMappingURL=cert.mjs.map
