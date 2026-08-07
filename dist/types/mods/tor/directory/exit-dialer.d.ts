import { TorStreamDuplex } from '../stream.js';

type ExitDialer = {
    /** RELAY_BEGIN to host:port via a Tor exit. `stream.outer` is Uint8Array. */
    dial(host: string, port: number, signal?: AbortSignal): Promise<TorStreamDuplex>;
    dispose(): Promise<void>;
};
type ExitDialerOptions = {
    meekUrl?: string;
    extendTimeoutMs?: number;
    /** Timeout for RELAY_BEGIN / stream open. Default 20s. */
    openTimeoutMs?: number;
    /** How many times to rebuild a circuit after DestroyedError. Default 3. */
    circuitAttempts?: number;
};
/**
 * Meek → Tor client → exit circuit → `openOrThrow(host, port)`.
 * Reuses one Tor client across dials; rebuilds on destroy.
 */
declare function createExitDialer(options?: ExitDialerOptions): ExitDialer;

export { createExitDialer };
export type { ExitDialer, ExitDialerOptions };
