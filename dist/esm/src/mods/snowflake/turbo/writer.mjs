import { Opaque } from '@hazae41/binary';
import { TurboFrame } from './frame.mjs';

class SecretTurboWriter {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    async onStart() {
        await this.parent.resolveOnStart.promise;
        const token = this.parent.class.token;
        this.parent.output.enqueue(new Opaque(token));
        const client = this.parent.client;
        this.parent.output.enqueue(new Opaque(client));
    }
    async onWrite(fragment) {
        const frame = TurboFrame.createOrThrow({ padding: false, fragment });
        this.parent.output.enqueue(frame);
    }
}

export { SecretTurboWriter };
//# sourceMappingURL=writer.mjs.map
