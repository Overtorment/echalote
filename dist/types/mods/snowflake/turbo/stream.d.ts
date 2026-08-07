import * as _hazae41_cascade from '@hazae41/cascade';
import { FullDuplex } from '@hazae41/cascade';
import { Opaque, Writable } from '@hazae41/binary';
import { Future } from '@hazae41/future';
import { Awaitable } from '../../../libs/promises/index.js';
import { SecretTurboReader } from './reader.js';
import { SecretTurboWriter } from './writer.js';

interface TurboDuplexParams {
    readonly client?: Uint8Array;
    close?(this: undefined): Awaitable<void>;
    error?(this: undefined, reason?: unknown): Awaitable<void>;
}
declare class TurboDuplex {
    #private;
    readonly params: TurboDuplexParams;
    constructor(params?: TurboDuplexParams);
    [Symbol.dispose](): void;
    get client(): Uint8Array;
    get inner(): ReadableWritablePair<Writable, Opaque<Uint8Array>>;
    get outer(): ReadableWritablePair<Opaque<Uint8Array>, Writable>;
    get closing(): {
        reason?: undefined;
    } | undefined;
    get closed(): {
        reason?: undefined;
    } | undefined;
    error(reason?: unknown): void;
    close(): void;
}
declare class SecretTurboDuplex {
    #private;
    readonly params: TurboDuplexParams;
    static readonly token: Uint8Array;
    readonly duplex: FullDuplex<Opaque, Writable>;
    readonly reader: SecretTurboReader;
    readonly writer: SecretTurboWriter;
    readonly client: Uint8Array;
    readonly resolveOnStart: Future<void>;
    constructor(params?: TurboDuplexParams);
    get class(): typeof SecretTurboDuplex;
    [Symbol.dispose](): void;
    get inner(): ReadableWritablePair<Writable, Opaque<Uint8Array>>;
    get outer(): ReadableWritablePair<Opaque<Uint8Array>, Writable>;
    get input(): _hazae41_cascade.Simplex<Opaque<Uint8Array>, Opaque<Uint8Array>>;
    get output(): _hazae41_cascade.Simplex<Writable, Writable>;
    get closing(): {
        reason?: undefined;
    } | undefined;
    get closed(): {
        reason?: undefined;
    } | undefined;
    error(reason?: unknown): void;
    close(): void;
}

export { SecretTurboDuplex, TurboDuplex };
export type { TurboDuplexParams };
