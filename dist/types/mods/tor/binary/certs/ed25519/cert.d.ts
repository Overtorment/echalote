import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';
import { SignedWithEd25519Key } from './extensions/signer.js';

interface Extensions {
    signer?: SignedWithEd25519Key;
}
declare class UnknownCertExtensionError extends Error {
    #private;
    readonly type: number;
    readonly name: string;
    constructor(type: number);
}
declare class Ed25519Cert {
    readonly type: number;
    readonly version: number;
    readonly certType: number;
    readonly expiration: Date;
    readonly certKeyType: number;
    readonly certKey: Uint8Array<32>;
    readonly extensions: Extensions;
    readonly payload: Uint8Array;
    readonly signature: Uint8Array<64>;
    static readonly types: {
        readonly ED_TO_SIGN: 4;
        readonly SIGN_TO_TLS: 5;
        readonly SIGN_TO_AUTH: 6;
    };
    static readonly flags: {
        readonly AFFECTS_VALIDATION: 1;
    };
    constructor(type: number, version: number, certType: number, expiration: Date, certKeyType: number, certKey: Uint8Array<32>, extensions: Extensions, payload: Uint8Array, signature: Uint8Array<64>);
    verifyOrThrow(): Promise<boolean>;
    static readOrThrow(cursor: Cursor): Ed25519Cert;
}

export { Ed25519Cert, UnknownCertExtensionError };
export type { Extensions };
