import { Opaque, Writable } from '@hazae41/binary';
import { FullDuplex } from '@hazae41/cascade';

declare class BatchedFetchStream {
    #private;
    readonly request: RequestInfo;
    readonly duplex: FullDuplex<Opaque, Writable>;
    constructor(request: RequestInfo);
    loop(): Promise<void>;
}

export { BatchedFetchStream };
