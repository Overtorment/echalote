'use strict';

var http = require('../../libs/transports/http.cjs');

/**
 * Tor Browser's CDN77 meek bridge backend.
 * Azure `meek.azureedge.net` was retired and no longer resolves.
 */
const DEFAULT_MEEK_URL = "https://1603026938.rsc.cdn77.org/";
async function createMeekStream(url = DEFAULT_MEEK_URL) {
    const headers = { "x-session-id": crypto.randomUUID() };
    const request = new Request(url, { headers });
    return new http.BatchedFetchStream(request);
}

exports.DEFAULT_MEEK_URL = DEFAULT_MEEK_URL;
exports.createMeekStream = createMeekStream;
//# sourceMappingURL=meek.cjs.map
