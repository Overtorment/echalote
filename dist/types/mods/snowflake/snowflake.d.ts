import { Opaque, Writable } from '@hazae41/binary';

declare function createSnowflakeStream(raw: {
    outer: ReadableWritablePair<Opaque, Writable>;
}): {
    outer: ReadableWritablePair<Opaque, Writable>;
};

export { createSnowflakeStream };
