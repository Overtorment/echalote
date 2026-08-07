declare class Memory {
    #private;
    constructor(inner: Uint8Array);
    [Symbol.dispose](): void;
    ptr(): number;
    len(): number;
    get bytes(): Uint8Array;
}
declare class Aes128Ctr128BEKey {
    #private;
    constructor(key: Memory, iv: Memory);
    [Symbol.dispose](): void;
    apply_keystream(memory: Memory): void;
}

export { Aes128Ctr128BEKey, Memory };
