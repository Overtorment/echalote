import { Cursor } from '@hazae41/cursor';

declare class TypedAddress {
    readonly type: number;
    readonly value: Uint8Array;
    static readonly types: {
        readonly IPv4: 4;
        readonly IPv6: 6;
    };
    constructor(type: number, value: Uint8Array);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): TypedAddress;
}
declare class Address4 {
    readonly address: string;
    /**
     * IPv4 address
     * @param address xxx.xxx.xxx.xxx
     */
    constructor(address: string);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): Address4;
}
declare class Address6 {
    readonly address: `[${string}]`;
    /**
     * IPv6 address
     * @param address [xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx]
     */
    constructor(address: `[${string}]`);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): Address6;
}

export { Address4, Address6, TypedAddress };
