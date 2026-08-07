import { TurboFrame } from './frame.mjs';

class SecretTurboReader {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    async onWrite(chunk) {
        const frame = chunk.readIntoOrThrow(TurboFrame);
        if (frame.padding)
            return;
        this.parent.input.enqueue(frame.fragment);
    }
}

export { SecretTurboReader };
//# sourceMappingURL=reader.mjs.map
