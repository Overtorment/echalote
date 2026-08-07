'use strict';

var sha2_js = require('@noble/hashes/sha2.js');
var node_zlib = require('node:zlib');
var consensus = require('../consensus/consensus.cjs');

/**
 * Clearnet directory fetches.
 *
 * Full consensus over meek/Tor is often truncated (~3.5MB). Consumers fetch
 * consensus + microdesc bodies here, then build circuits through Tor.
 */
/**
 * v3 directory authorities (dirport), from tor `auth_dirs.inc`.
 * Serge (bridge authority) omitted — not a consensus voter for clients.
 */
const AUTHORITY_HOSTS = [
    "128.31.0.39:9231", // moria1
    "217.196.147.77:80", // tor26
    "45.66.35.11:80", // dizum
    "131.188.40.189:80", // gabelmoo
    "193.23.244.244:80", // dannenberg
    "171.25.193.9:443", // maatuska
    "199.58.81.140:80", // longclaw
    "204.13.164.118:80", // bastet
    "216.218.219.41:80", // faravahar
];
const CONSENSUS_MIRRORS = AUTHORITY_HOSTS.map((host) => `http://${host}/tor/status-vote/current/consensus-microdesc`);
let cached = null;
const CACHE_MS = 30 * 60 * 1000;
/** Cap each GET so a hung host cannot burn the whole abort budget. */
const MICRODESC_FETCH_MS = 8_000;
/** Full microdesc consensus is ~3.5MB; allow more headroom than microdescs. */
const CONSENSUS_FETCH_MS = 30_000;
function sha256Base64Unpadded(bytes) {
    const hash = sha2_js.sha256(bytes);
    return Buffer.from(hash).toString("base64").replace(/=+$/, "");
}
function maybeInflate(buf) {
    if (buf.length >= 2 && buf[0] === 0x78) {
        try {
            return node_zlib.inflateSync(buf);
        }
        catch {
            // not zlib
        }
    }
    return buf;
}
function withFetchTimeout(signal, ms) {
    return AbortSignal.any([signal, AbortSignal.timeout(ms)]);
}
async function fetchBytes(url, signal) {
    try {
        // Tor `.z` bodies are often raw zlib without Content-Encoding.
        // Bun's fetch tries to inflate them and throws ZlibError unless decompress
        // is disabled; Node ignores the unknown option / does not auto-inflate.
        const init = {
            signal: withFetchTimeout(signal, MICRODESC_FETCH_MS),
            decompress: false,
        };
        const res = await fetch(url, init);
        if (!res.ok)
            return null;
        const buf = Buffer.from(await res.arrayBuffer());
        return buf.length > 0 ? buf : null;
    }
    catch {
        return null;
    }
}
function shuffleInPlace(items) {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
}
/**
 * Fetch + parse the microdesc consensus over clearnet HTTP.
 */
async function fetchMicrodescConsensus(signal = new AbortController().signal, options = {}) {
    if (!options.force && cached && Date.now() - cached.at < CACHE_MS) {
        return cached.consensus;
    }
    const mirrors = shuffleInPlace([...(options.mirrors ?? CONSENSUS_MIRRORS)]);
    let lastError;
    for (const url of mirrors) {
        try {
            const res = await fetch(url, {
                signal: withFetchTimeout(signal, CONSENSUS_FETCH_MS),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            if (!text.includes("directory-footer")) {
                throw new Error("truncated consensus (no directory-footer)");
            }
            const consensus$1 = consensus.Consensus.parseOrThrow(text);
            if (consensus$1.microdescs.length === 0) {
                throw new Error("consensus has no microdescs");
            }
            cached = { at: Date.now(), consensus: consensus$1 };
            return consensus$1;
        }
        catch (err) {
            if (signal.aborted)
                throw err;
            lastError = err;
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error("consensus fetch failed");
}
/**
 * Fetch + verify a microdescriptor body over clearnet.
 * Prefers the relay dirport, then directory authorities.
 */
async function fetchMicrodesc(head, signal = new AbortController().signal, options = {}) {
    const dig = head.microdesc;
    const authorityHosts = options.authorityHosts ?? AUTHORITY_HOSTS;
    // Prefer directory authorities: many relay dirports are firewalled or hang
    // from CI/cloud networks and would otherwise burn the whole abort budget.
    const urls = [];
    for (const host of authorityHosts) {
        urls.push(`http://${host}/tor/micro/d/${dig}.z`);
        urls.push(`http://${host}/tor/micro/d/${dig}`);
    }
    if (head.dirport > 0) {
        urls.push(`http://${head.hostname}:${head.dirport}/tor/micro/d/${dig}.z`);
        urls.push(`http://${head.hostname}:${head.dirport}/tor/micro/d/${dig}`);
    }
    let lastError = new Error("no microdesc URL succeeded");
    for (const url of urls) {
        if (signal.aborted)
            break;
        try {
            const raw = await fetchBytes(url, signal);
            if (!raw)
                continue;
            const body = maybeInflate(raw);
            const got = sha256Base64Unpadded(body);
            if (got !== dig) {
                lastError = new Error(`digest mismatch for ${url}`);
                continue;
            }
            const text = body.toString("utf8");
            const [parsed] = consensus.Consensus.Microdesc.parseOrThrow(text);
            if (!parsed)
                throw new Error("empty microdescriptor");
            return { ...head, ...parsed };
        }
        catch (err) {
            lastError = err;
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error(`microdesc fetch failed for ${head.nickname}`);
}

exports.AUTHORITY_HOSTS = AUTHORITY_HOSTS;
exports.CONSENSUS_MIRRORS = CONSENSUS_MIRRORS;
exports.fetchMicrodesc = fetchMicrodesc;
exports.fetchMicrodescConsensus = fetchMicrodescConsensus;
//# sourceMappingURL=clearnet.cjs.map
