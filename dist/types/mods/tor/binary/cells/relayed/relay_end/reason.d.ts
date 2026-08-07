import { Cursor } from '@hazae41/cursor';
import { Address4, Address6 } from '../../../address.js';

type RelayEndReason = RelayEndReasonExitPolicy | RelayEndReasonOther;
declare class RelayEndReasonOther {
    readonly id: number;
    constructor(id: number);
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
}
declare class RelayEndReasonExitPolicy {
    #private;
    readonly address: Address4 | Address6;
    readonly ttl: Date;
    static readonly id = 4;
    constructor(address: Address4 | Address6, ttl: Date);
    get id(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): RelayEndReasonExitPolicy;
}

export { RelayEndReasonExitPolicy, RelayEndReasonOther };
export type { RelayEndReason };
