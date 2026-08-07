import { Cursor } from '@hazae41/cursor';
import { Certs } from '../../../../certs/certs.js';

declare class CertsCell {
    #private;
    readonly certs: Partial<Certs>;
    static readonly old = false;
    static readonly circuit = false;
    static readonly command = 129;
    constructor(certs: Partial<Certs>);
    get circuit(): false;
    get command(): 129;
    sizeOrThrow(): never;
    writeOrThrow(cursor: Cursor): never;
    static readOrThrow(cursor: Cursor): CertsCell;
}

export { CertsCell };
