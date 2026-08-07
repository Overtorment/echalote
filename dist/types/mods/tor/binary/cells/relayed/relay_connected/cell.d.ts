import { Cursor } from '@hazae41/cursor';
import { Address4, Address6 } from '../../../address.js';

declare class UnknownAddressType extends Error {
    #private;
    readonly type: number;
    readonly name: string;
    constructor(type: number);
}
declare class RelayConnectedCell {
    #private;
    readonly address: Address4 | Address6;
    readonly ttl: Date;
    static readonly early = false;
    static readonly stream = true;
    static readonly rcommand = 4;
    constructor(address: Address4 | Address6, ttl: Date);
    get early(): false;
    get stream(): true;
    get rcommand(): 4;
    sizeOrThrow(): never;
    writeOrThrow(cursor: Cursor): never;
    static readOrThrow(cursor: Cursor): RelayConnectedCell;
}

export { RelayConnectedCell, UnknownAddressType };
