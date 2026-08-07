import { Aes128Ctr128BEKey } from '../../libs/aes/index.js';
import { Uint8Array } from '@hazae41/bytes';
import { Sha1 } from '@hazae41/sha1';
import { SecretCircuit } from './circuit.js';

declare class Target {
    #private;
    readonly relayid_rsa: Uint8Array;
    readonly circuit: SecretCircuit;
    readonly forward_digest: Sha1.Hasher;
    readonly backward_digest: Sha1.Hasher;
    readonly forward_key: Aes128Ctr128BEKey;
    readonly backward_key: Aes128Ctr128BEKey;
    delivery: number;
    package: number;
    digests: (globalThis.Uint8Array & {
        readonly length: 20;
    })[];
    constructor(relayid_rsa: Uint8Array, circuit: SecretCircuit, forward_digest: Sha1.Hasher, backward_digest: Sha1.Hasher, forward_key: Aes128Ctr128BEKey, backward_key: Aes128Ctr128BEKey);
    [Symbol.dispose](): void;
}

export { Target };
