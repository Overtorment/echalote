import { BatchedFetchStream } from '../../libs/transports/http.js';

/**
 * Tor Browser's CDN77 meek bridge backend.
 * Azure `meek.azureedge.net` was retired and no longer resolves.
 */
declare const DEFAULT_MEEK_URL = "https://1603026938.rsc.cdn77.org/";
declare function createMeekStream(url?: string): Promise<BatchedFetchStream>;

export { DEFAULT_MEEK_URL, createMeekStream };
