import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';
import { X509 } from '@hazae41/x509';

declare class RsaCert {
    readonly type: number;
    readonly data: Uint8Array;
    readonly x509: X509.Certificate;
    static readonly types: {
        readonly RSA_SELF: 2;
        readonly RSA_TO_TLS: 1;
        readonly RSA_TO_AUTH: 3;
    };
    constructor(type: number, data: Uint8Array, x509: X509.Certificate);
    sha1OrThrow(): Promise<globalThis.Uint8Array & {
        readonly length: 20;
    }>;
    verifyOrThrow(): boolean;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RsaCert;
}

export { RsaCert };
