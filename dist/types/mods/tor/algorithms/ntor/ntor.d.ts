import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';
import { HASH_LEN, KEY_LEN } from '../../constants.js';

declare class InvalidNtorAuthError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class NtorResponse {
    readonly public_y: Uint8Array<32>;
    readonly auth: Uint8Array<32>;
    constructor(public_y: Uint8Array<32>, auth: Uint8Array<32>);
    static readOrThrow(cursor: Cursor): NtorResponse;
}
declare class NtorRequest {
    readonly public_x: Uint8Array<32>;
    readonly relayid_rsa: Uint8Array<20>;
    readonly ntor_onion_key: Uint8Array<32>;
    constructor(public_x: Uint8Array<32>, relayid_rsa: Uint8Array<20>, ntor_onion_key: Uint8Array<32>);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}
interface NtorResult {
    readonly auth: Uint8Array<32>;
    readonly nonce: Uint8Array<HASH_LEN>;
    readonly forwardDigest: Uint8Array<HASH_LEN>;
    readonly backwardDigest: Uint8Array<HASH_LEN>;
    readonly forwardKey: Uint8Array<KEY_LEN>;
    readonly backwardKey: Uint8Array<KEY_LEN>;
}
declare namespace NtorResult {
    function finalizeOrThrow(shared_xy: Uint8Array<32>, shared_xb: Uint8Array<32>, relayid_rsa: Uint8Array<20>, public_b: Uint8Array<32>, public_x: Uint8Array<32>, public_y: Uint8Array<32>): Promise<NtorResult>;
}

export { InvalidNtorAuthError, NtorRequest, NtorResponse, NtorResult };
