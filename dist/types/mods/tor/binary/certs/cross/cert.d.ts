import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';

declare class CrossCert {
    #private;
    readonly type: number;
    readonly key: Uint8Array<32>;
    readonly expiration: Date;
    readonly payload: Uint8Array;
    readonly signature: Uint8Array;
    static readonly types: {
        readonly RSA_TO_ED: 7;
    };
    constructor(type: number, key: Uint8Array<32>, expiration: Date, payload: Uint8Array, signature: Uint8Array);
    verifyOrThrow(): boolean;
    sizeOrThrow(): never;
    writeOrThrow(cursor: Cursor): never;
    static readOrThrow(cursor: Cursor): CrossCert;
}

export { CrossCert };
