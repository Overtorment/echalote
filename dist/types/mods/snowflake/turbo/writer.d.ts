import { Writable } from '@hazae41/binary';
import { SecretTurboDuplex } from './stream.js';

declare class SecretTurboWriter {
    readonly parent: SecretTurboDuplex;
    constructor(parent: SecretTurboDuplex);
    onStart(): Promise<void>;
    onWrite(fragment: Writable): Promise<void>;
}

export { SecretTurboWriter };
