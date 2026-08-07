import { Cursor } from '@hazae41/cursor';

type RelayExtend2Link = RelayExtend2LinkIPv4 | RelayExtend2LinkIPv6 | RelayExtend2LinkLegacyID | RelayExtend2LinkModernID;
declare namespace RelayExtend2Link {
    function fromAddressString(address: string): RelayExtend2LinkIPv4 | RelayExtend2LinkIPv6;
}
declare class RelayExtend2LinkIPv4 {
    #private;
    readonly hostname: string;
    readonly port: number;
    static readonly type = 0;
    constructor(hostname: string, port: number);
    static from(host: string): RelayExtend2LinkIPv4;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}
declare class RelayExtend2LinkIPv6 {
    #private;
    readonly hostname: string;
    readonly port: number;
    static readonly type = 1;
    constructor(hostname: string, port: number);
    static from(addrress: string): RelayExtend2LinkIPv6;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}
declare class RelayExtend2LinkLegacyID {
    #private;
    readonly fingerprint: Uint8Array;
    static readonly type = 2;
    constructor(fingerprint: Uint8Array);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}
declare class RelayExtend2LinkModernID {
    #private;
    readonly fingerprint: Uint8Array;
    static readonly type = 3;
    constructor(fingerprint: Uint8Array);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}

export { RelayExtend2Link, RelayExtend2LinkIPv4, RelayExtend2LinkIPv6, RelayExtend2LinkLegacyID, RelayExtend2LinkModernID };
