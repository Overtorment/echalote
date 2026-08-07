'use strict';

var clearnet = require('./clearnet.cjs');

function isDestroyedCircuitError(err) {
    const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err);
    return (msg.includes("Circuit destroyed") ||
        msg.includes("DestroyedError") ||
        msg.includes("Relay ended") ||
        msg.includes("RelayEndedError"));
}
async function pickExtendable(pool, signal, tries) {
    const remaining = [...pool];
    let lastError = new Error("no extendable relays");
    for (let i = 0; i < tries && remaining.length > 0; i++) {
        const idx = Math.floor(Math.random() * remaining.length);
        const [head] = remaining.splice(idx, 1);
        if (!head)
            break;
        try {
            return await clearnet.fetchMicrodesc(head, signal);
        }
        catch (err) {
            lastError = err;
        }
    }
    throw lastError instanceof Error ? lastError : new Error("no extendable relays");
}
async function buildExitCircuitOnce(client, signal, options) {
    const circuit = await client.createOrThrow(signal);
    try {
        const consensus = await clearnet.fetchMicrodescConsensus(signal, {
            mirrors: options.consensusUrls,
        });
        const middles = consensus.microdescs.filter((it) => it.flags.includes("Fast") &&
            it.flags.includes("Stable") &&
            it.flags.includes("V2Dir"));
        const exits = consensus.microdescs.filter((it) => it.flags.includes("Fast") &&
            it.flags.includes("Stable") &&
            it.flags.includes("Exit") &&
            !it.flags.includes("BadExit"));
        if (middles.length === 0 || exits.length === 0) {
            throw new Error(`tor consensus missing usable relays (middles=${middles.length} exits=${exits.length})`);
        }
        const middleFull = await pickExtendable(middles, signal, options.pickTries);
        await circuit.extendOrThrow(middleFull, AbortSignal.any([signal, AbortSignal.timeout(options.extendTimeoutMs)]));
        const exitFull = await pickExtendable(exits.filter((e) => e.identity !== middleFull.identity), signal, options.pickTries);
        await circuit.extendOrThrow(exitFull, AbortSignal.any([signal, AbortSignal.timeout(options.extendTimeoutMs)]));
        return circuit;
    }
    catch (err) {
        try {
            await circuit.close();
        }
        catch {
            // ignore
        }
        throw err;
    }
}
/**
 * Build a 3-hop exit circuit using clearnet directory data + Tor extends.
 */
async function buildExitCircuit(client, signal = new AbortController().signal, options = {}) {
    const extendTimeoutMs = options.extendTimeoutMs ?? 15_000;
    const attempts = options.attempts ?? 3;
    const pickTries = options.pickTries ?? 8;
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await buildExitCircuitOnce(client, signal, {
                consensusUrls: options.consensusUrls,
                extendTimeoutMs,
                pickTries,
            });
        }
        catch (err) {
            lastError = err;
            if (signal.aborted || !isDestroyedCircuitError(err))
                break;
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error("extend circuit failed", { cause: lastError });
}

exports.buildExitCircuit = buildExitCircuit;
//# sourceMappingURL=build-exit-circuit.cjs.map
