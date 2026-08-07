import { Uint8Array } from '@hazae41/bytes';
import { Cursor } from '@hazae41/cursor';

interface CreateFastCellInit {
    readonly material: Uint8Array<20>;
}
declare class CreateFastCell {
    #private;
    readonly material: Uint8Array<20>;
    static readonly old = false;
    static readonly circuit = true;
    static readonly command = 5;
    /**
     * The CREATE_FAST cell
     * @param material Key material (X) [20]
     */
    constructor(material: Uint8Array<20>);
    get old(): false;
    get circuit(): true;
    get command(): 5;
    sizeOrThrow(): 20;
    writeOrThrow(cursor: Cursor): void;
    static readOrThrow(cursor: Cursor): CreateFastCell;
}

export { CreateFastCell };
export type { CreateFastCellInit };
