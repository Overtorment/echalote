import { Consensus } from '../consensus/consensus.js';

/**
 * v3 directory authorities (dirport), from tor `auth_dirs.inc`.
 * Serge (bridge authority) omitted — not a consensus voter for clients.
 */
declare const AUTHORITY_HOSTS: readonly ["128.31.0.39:9231", "217.196.147.77:80", "45.66.35.11:80", "131.188.40.189:80", "193.23.244.244:80", "171.25.193.9:443", "199.58.81.140:80", "204.13.164.118:80", "216.218.219.41:80"];
declare const CONSENSUS_MIRRORS: string[];
type FetchMicrodescConsensusOptions = {
    mirrors?: readonly string[];
    /** Skip the in-process cache. Default false. */
    force?: boolean;
};
/**
 * Fetch + parse the microdesc consensus over clearnet HTTP.
 */
declare function fetchMicrodescConsensus(signal?: AbortSignal, options?: FetchMicrodescConsensusOptions): Promise<Consensus>;
type FetchMicrodescOptions = {
    authorityHosts?: readonly string[];
};
/**
 * Fetch + verify a microdescriptor body over clearnet.
 * Prefers the relay dirport, then directory authorities.
 */
declare function fetchMicrodesc(head: Consensus.Microdesc.Head, signal?: AbortSignal, options?: FetchMicrodescOptions): Promise<Consensus.Microdesc>;

export { AUTHORITY_HOSTS, CONSENSUS_MIRRORS, fetchMicrodesc, fetchMicrodescConsensus };
export type { FetchMicrodescConsensusOptions, FetchMicrodescOptions };
