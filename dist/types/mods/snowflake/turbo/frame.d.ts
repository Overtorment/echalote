import { Writable, Opaque } from '@hazae41/binary';
import { Cursor } from '@hazae41/cursor';

type TurboFrameError = UnexpectedContinuationError | FragmentOverflowError;
declare class FragmentOverflowError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnexpectedContinuationError extends Error {
    #private;
    readonly name: string;
    constructor();
}
interface TurboFrameParams<T extends Writable> {
    readonly padding: boolean;
    readonly fragment: T;
}
declare class TurboFrame<T extends Writable> {
    readonly padding: boolean;
    readonly fragment: T;
    readonly fragmentSize: number;
    private constructor();
    static createOrThrow<T extends Writable>(params: TurboFrameParams<T>): TurboFrame<T>;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    writeOrThrow6(cursor: Cursor, size: number): void;
    writeOrThrow13(cursor: Cursor, size: number): void;
    writeOrThrow20(cursor: Cursor, size: number): void;
    /**
     * Read from bytes
     * @param binary bytes
     */
    static readOrThrow(cursor: Cursor): TurboFrame<Opaque<Uint8Array & {
        readonly length: number;
    }>>;
}

export { FragmentOverflowError, TurboFrame, UnexpectedContinuationError };
export type { TurboFrameError, TurboFrameParams };
