import { X509 } from '@hazae41/x509';
import { CrossCert } from '../binary/certs/cross/cert.js';
import { Ed25519Cert, UnknownCertExtensionError } from '../binary/certs/ed25519/cert.js';
import { RsaCert } from '../binary/certs/rsa/cert.js';

type CertError = DuplicatedCertError | UnknownCertError | ExpectedCertError | ExpiredCertError | PrematureCertError | InvalidSignatureError | UnknownCertExtensionError | InvalidCertError;
declare class DuplicatedCertError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnknownCertError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class ExpectedCertError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class ExpiredCertError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class PrematureCertError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class InvalidSignatureError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class InvalidCertError extends Error {
    #private;
    readonly name: string;
    constructor();
}
interface Certs {
    readonly rsa_self: RsaCert;
    readonly rsa_to_tls?: RsaCert;
    readonly rsa_to_auth?: RsaCert;
    readonly rsa_to_ed: CrossCert;
    readonly ed_to_sign: Ed25519Cert;
    readonly sign_to_tls: Ed25519Cert;
    readonly sign_to_auth?: Ed25519Cert;
}
declare namespace Certs {
    function verifyOrThrow(pcerts: Partial<Certs>, tlsCerts?: X509.Certificate[]): Promise<Certs>;
}

export { Certs, DuplicatedCertError, ExpectedCertError, ExpiredCertError, InvalidCertError, InvalidSignatureError, PrematureCertError, UnknownCertError };
export type { CertError };
