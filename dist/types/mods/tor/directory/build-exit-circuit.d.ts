import { Circuit } from '../circuit.js';
import { TorClientDuplex } from '../client.js';

type BuildExitCircuitOptions = {
    /** Clearnet consensus mirror URLs. */
    consensusUrls?: readonly string[];
    /** Per-extend timeout. Default 15s. */
    extendTimeoutMs?: number;
    /** How many times to rebuild after destroyed-circuit errors. Default 3. */
    attempts?: number;
    /** Candidates to try when fetching a full microdesc. Default 8. */
    pickTries?: number;
};
/**
 * Build a 3-hop exit circuit using clearnet directory data + Tor extends.
 */
declare function buildExitCircuit(client: TorClientDuplex, signal?: AbortSignal, options?: BuildExitCircuitOptions): Promise<Circuit>;

export { buildExitCircuit };
export type { BuildExitCircuitOptions };
