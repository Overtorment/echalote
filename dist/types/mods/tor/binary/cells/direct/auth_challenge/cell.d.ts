import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';

declare class AuthChallengeCell {
    #private;
    readonly challenge: Uint8Array<32>;
    readonly methods: number[];
    static readonly old = false;
    static readonly circuit = false;
    static readonly command = 130;
    constructor(challenge: Uint8Array<32>, methods: number[]);
    get circuit(): boolean;
    get command(): number;
    sizeOrThrow(): never;
    writeOrThrow(cursor: Cursor): never;
    static readOrThrow(cursor: Cursor): AuthChallengeCell;
}

export { AuthChallengeCell };
