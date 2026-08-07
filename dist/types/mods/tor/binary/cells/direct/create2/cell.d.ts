import { Cursor } from '@hazae41/cursor';

declare class Create2Cell {
    #private;
    readonly type: number;
    readonly data: Uint8Array;
    static readonly circuit = true;
    static readonly command = 10;
    static readonly types: {
        /**
         * The old, slow, and insecure handshake
         * @deprecated
         */
        readonly TAP: 0;
        /**
         * The new, quick, and secure handshake
         */
        readonly NTOR: 2;
    };
    constructor(type: number, data: Uint8Array);
    get command(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): Create2Cell;
}

export { Create2Cell };
