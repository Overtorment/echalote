import { Cursor } from '@hazae41/cursor';
import { TypedAddress } from '../../../address.js';

declare class NetinfoCell {
    #private;
    readonly time: number;
    readonly other: TypedAddress;
    readonly owneds: TypedAddress[];
    static readonly old = false;
    static readonly circuit = false;
    static readonly command = 8;
    constructor(time: number, other: TypedAddress, owneds: TypedAddress[]);
    get old(): false;
    get circuit(): false;
    get command(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): NetinfoCell;
}

export { NetinfoCell };
