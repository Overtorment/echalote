import { Writable } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';
import { RelayExtend2Link } from './link.js';

declare class RelayExtend2Cell<T extends Writable> {
    #private;
    readonly type: number;
    readonly links: RelayExtend2Link[];
    readonly data: T;
    static readonly early = true;
    static readonly stream = false;
    static readonly rcommand = 14;
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
    constructor(type: number, links: RelayExtend2Link[], data: T);
    get early(): true;
    get stream(): false;
    get rcommand(): 14;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}

export { RelayExtend2Cell };
