'use strict';

var tslib_es6 = require('../../../../node_modules/tslib/tslib.es6.cjs');
var binary = require('@hazae41/binary');
var bytes = require('@hazae41/bytes');
var ed25519 = require('@hazae41/ed25519');
var index = require('../../../libs/rsa/index.cjs');
var x509 = require('@hazae41/x509');

var _a, _b, _c, _d, _e, _f, _g;
class DuplicatedCertError extends Error {
    #class = _a;
    name = this.#class.name;
    constructor() {
        super(`Duplicated certificate`);
    }
}
_a = DuplicatedCertError;
class UnknownCertError extends Error {
    #class = _b;
    name = this.#class.name;
    constructor() {
        super(`Unknown certificate`);
    }
}
_b = UnknownCertError;
class ExpectedCertError extends Error {
    #class = _c;
    name = this.#class.name;
    constructor() {
        super(`Expected a certificate`);
    }
}
_c = ExpectedCertError;
class ExpiredCertError extends Error {
    #class = _d;
    name = this.#class.name;
    constructor() {
        super(`Expired certificate`);
    }
}
_d = ExpiredCertError;
class PrematureCertError extends Error {
    #class = _e;
    name = this.#class.name;
    constructor() {
        super(`Premature certificate`);
    }
}
_e = PrematureCertError;
class InvalidSignatureError extends Error {
    #class = _f;
    name = this.#class.name;
    constructor() {
        super(`Invalid certificate signature`);
    }
}
_f = InvalidSignatureError;
class InvalidCertError extends Error {
    #class = _g;
    name = this.#class.name;
    constructor() {
        super(`Invalid certificate`);
    }
}
_g = InvalidCertError;
exports.Certs = void 0;
(function (Certs) {
    async function verifyOrThrow(pcerts, tlsCerts) {
        const { rsa_self, rsa_to_ed, ed_to_sign, sign_to_tls } = pcerts;
        if (tlsCerts == null)
            throw new ExpectedCertError();
        if (rsa_self == null)
            throw new ExpectedCertError();
        if (rsa_to_ed == null)
            throw new ExpectedCertError();
        if (ed_to_sign == null)
            throw new ExpectedCertError();
        if (sign_to_tls == null)
            throw new ExpectedCertError();
        const certs = { rsa_self, rsa_to_ed, ed_to_sign, sign_to_tls };
        const result = await Promise.all([
            verifyRsaSelfOrThrow(certs),
            verifyRsaToEdOrThrow(certs),
            verifyEdToSigningOrThrow(certs),
            verifySigningToTlsOrThrow(certs, tlsCerts),
        ]).then(all => all.every(x => x === true));
        if (result !== true)
            throw new Error(`Could not verify certs`);
        return certs;
    }
    Certs.verifyOrThrow = verifyOrThrow;
    async function verifyRsaSelfOrThrow(certs) {
        if (certs.rsa_self.verifyOrThrow() !== true)
            throw new Error(`Could not verify ID_SELF cert`);
        const length = certs.rsa_self.x509.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey.bytes.length;
        /**
         * Only accept 1024-bits (128-bytes) public keys
         */
        if (length !== 12 + 128)
            throw new InvalidCertError();
        const signed = x509.X509.writeToBytesOrThrow(certs.rsa_self.x509.tbsCertificate);
        const publicKey = x509.X509.writeToBytesOrThrow(certs.rsa_self.x509.tbsCertificate.subjectPublicKeyInfo);
        const signatureAlgorithm = { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } };
        const signature = certs.rsa_self.x509.signatureValue.bytes;
        const key = await crypto.subtle.importKey("spki", publicKey, signatureAlgorithm, true, ["verify"]);
        const verified = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signed);
        if (verified !== true)
            throw new InvalidSignatureError();
        /**
         * We don't verify the RSA identity on Snowflake / Meek
         */
        return true;
    }
    async function verifyRsaToEdOrThrow(certs) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            if (certs.rsa_to_ed.verifyOrThrow() !== true)
                throw new Error(`Could not verify ID_TO_ED cert`);
            const publicKeyBytes = x509.X509.writeToBytesOrThrow(certs.rsa_self.x509.tbsCertificate.subjectPublicKeyInfo);
            const publicKeyMemory = tslib_es6.__addDisposableResource(env_1, new index.RsaWasm.Memory(publicKeyBytes), false);
            const publicKeyPointer = tslib_es6.__addDisposableResource(env_1, index.RsaPublicKey.from_public_key_der(publicKeyMemory), false);
            const prefix = bytes.Bytes.fromUtf8("Tor TLS RSA/Ed25519 cross-certificate");
            const prefixed = bytes.Bytes.concat([prefix, certs.rsa_to_ed.payload]);
            const hashed = new Uint8Array(await crypto.subtle.digest("SHA-256", prefixed));
            const hashedMemory = tslib_es6.__addDisposableResource(env_1, new index.RsaWasm.Memory(hashed), false);
            const signatureMemory = tslib_es6.__addDisposableResource(env_1, new index.RsaWasm.Memory(certs.rsa_to_ed.signature), false);
            const verified = publicKeyPointer.verify_pkcs1v15_unprefixed(hashedMemory, signatureMemory);
            if (verified !== true)
                throw new InvalidSignatureError();
            /**
             * We don't verify the Ed25519 identity on Snowflake / Meek
             */
            return true;
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            tslib_es6.__disposeResources(env_1);
        }
    }
    async function verifyEdToSigningOrThrow(certs) {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            if (await certs.ed_to_sign.verifyOrThrow() !== true)
                throw new Error(`Could not verify ED_TO_SIGN cert`);
            const identity = tslib_es6.__addDisposableResource(env_2, await ed25519.Ed25519.get().getOrThrow().VerifyingKey.importOrThrow(certs.rsa_to_ed.key), false);
            const signature = tslib_es6.__addDisposableResource(env_2, ed25519.Ed25519.get().getOrThrow().Signature.importOrThrow(certs.ed_to_sign.signature), false);
            const verified = await identity.verifyOrThrow(certs.ed_to_sign.payload, signature);
            if (verified !== true)
                throw new InvalidSignatureError();
            return true;
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            tslib_es6.__disposeResources(env_2);
        }
    }
    async function verifySigningToTlsOrThrow(certs, tlsCerts) {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            if (await certs.sign_to_tls.verifyOrThrow() !== true)
                throw new Error(`Could not verify SIGNING_TO_TLS cert`);
            const identity = tslib_es6.__addDisposableResource(env_3, await ed25519.Ed25519.get().getOrThrow().VerifyingKey.importOrThrow(certs.ed_to_sign.certKey), false);
            const signature = tslib_es6.__addDisposableResource(env_3, ed25519.Ed25519.get().getOrThrow().Signature.importOrThrow(certs.sign_to_tls.signature), false);
            const verified = await identity.verifyOrThrow(certs.sign_to_tls.payload, signature);
            if (verified !== true)
                throw new InvalidSignatureError();
            const tls = binary.Writable.writeToBytesOrThrow(tlsCerts[0].toDER());
            const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", tls));
            if (bytes.Bytes.equals(hash, certs.sign_to_tls.certKey) !== true)
                throw new InvalidCertError();
            return true;
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            tslib_es6.__disposeResources(env_3);
        }
    }
})(exports.Certs || (exports.Certs = {}));

exports.DuplicatedCertError = DuplicatedCertError;
exports.ExpectedCertError = ExpectedCertError;
exports.ExpiredCertError = ExpiredCertError;
exports.InvalidCertError = InvalidCertError;
exports.InvalidSignatureError = InvalidSignatureError;
exports.PrematureCertError = PrematureCertError;
exports.UnknownCertError = UnknownCertError;
//# sourceMappingURL=certs.cjs.map
