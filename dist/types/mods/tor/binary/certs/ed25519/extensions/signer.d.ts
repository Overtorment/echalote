import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';

declare class SignedWithEd25519Key {
    #private;
    readonly key: Uint8Array<32>;
    static readonly type = 4;
    constructor(key: Uint8Array<32>);
    get type(): 4;
    static readOrThrow(cursor: Cursor): SignedWithEd25519Key;
}

export { SignedWithEd25519Key };
