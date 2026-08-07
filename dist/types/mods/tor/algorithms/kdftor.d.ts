import { Uint8Array } from '@hazae41/bytes';
import { HASH_LEN, KEY_LEN } from '../constants.js';

declare class InvalidKdfKeyHashError extends Error {
    #private;
    readonly name: string;
    constructor();
}
interface KDFTorResult {
    readonly keyHash: Uint8Array<HASH_LEN>;
    readonly forwardDigest: Uint8Array<HASH_LEN>;
    readonly backwardDigest: Uint8Array<HASH_LEN>;
    readonly forwardKey: Uint8Array<KEY_LEN>;
    readonly backwardKey: Uint8Array<KEY_LEN>;
}
declare namespace KDFTorResult {
    function computeOrThrow(k0: Uint8Array): Promise<KDFTorResult>;
}

export { InvalidKdfKeyHashError, KDFTorResult };
