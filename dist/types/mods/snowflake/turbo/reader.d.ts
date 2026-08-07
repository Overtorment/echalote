import { Opaque } from '@hazae41/binary';
import { SecretTurboDuplex } from './stream.js';

declare class SecretTurboReader {
    readonly parent: SecretTurboDuplex;
    constructor(parent: SecretTurboDuplex);
    onWrite(chunk: Opaque): Promise<void>;
}

export { SecretTurboReader };
