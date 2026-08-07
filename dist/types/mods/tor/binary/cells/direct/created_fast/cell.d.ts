import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';

declare class CreatedFastCell {
    #private;
    readonly material: Uint8Array<20>;
    readonly derivative: Uint8Array<20>;
    static readonly old = false;
    static readonly circuit = true;
    static readonly command = 6;
    constructor(material: Uint8Array<20>, derivative: Uint8Array<20>);
    get command(): number;
    sizeOrThrow(): number;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): CreatedFastCell;
}

export { CreatedFastCell };
