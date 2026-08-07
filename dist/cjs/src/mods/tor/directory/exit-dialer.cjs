'use strict';

var meek = require('../../meek/meek.cjs');
var client = require('../client.cjs');
var buildExitCircuit = require('./build-exit-circuit.cjs');

/**
 * High-level clearnet dial over meek + exit circuit.
 * Onion-service (HS) client is not implemented.
 */
function errorDetail(err) {
    if (err instanceof Error) {
        const cause = err.cause instanceof Error
            ? ` ← ${err.cause.message}`
            : err.cause != null
                ? ` ← ${String(err.cause)}`
                : "";
        return `${err.message}${cause}`;
    }
    return String(err);
}
function wrapDialError(stage, err) {
    const out = new Error(`tor ${stage}: ${errorDetail(err)}`);
    out.cause = err;
    return out;
}
function isDestroyedCircuitError(err) {
    const msg = errorDetail(err);
    return (msg.includes("Circuit destroyed") ||
        msg.includes("DestroyedError") ||
        msg.includes("Relay ended") ||
        msg.includes("RelayEndedError"));
}
/** Close the exit circuit when the stream is closed. */
function bindCircuitLifetime(stream, circuit) {
    const origClose = stream.close.bind(stream);
    stream.close = () => {
        origClose();
        void circuit.close().catch(() => { });
    };
    return stream;
}
/**
 * Meek → Tor client → exit circuit → `openOrThrow(host, port)`.
 * Reuses one Tor client across dials; rebuilds on destroy.
 */
function createExitDialer(options = {}) {
    const meekUrl = options.meekUrl ?? meek.DEFAULT_MEEK_URL;
    const extendTimeoutMs = options.extendTimeoutMs ?? 15_000;
    const openTimeoutMs = options.openTimeoutMs ?? 20_000;
    const circuitAttempts = options.circuitAttempts ?? 3;
    let tor = null;
    let ready = null;
    let disposed = false;
    function resetTor() {
        try {
            tor?.close();
        }
        catch {
            // ignore
        }
        tor = null;
        ready = null;
    }
    async function ensureTor(signal) {
        if (disposed)
            throw new Error("exit dialer disposed");
        if (tor?.closed != null) {
            resetTor();
        }
        if (tor)
            return tor;
        if (!ready) {
            ready = (async () => {
                try {
                    const meek$1 = await meek.createMeekStream(meekUrl);
                    const client$1 = new client.TorClientDuplex();
                    meek$1.duplex.outer.readable
                        .pipeTo(client$1.inner.writable)
                        .catch(() => {
                        if (tor === client$1)
                            resetTor();
                    });
                    client$1.inner.readable
                        .pipeTo(meek$1.duplex.outer.writable)
                        .catch(() => {
                        if (tor === client$1)
                            resetTor();
                    });
                    await client$1.waitOrThrow(signal);
                    tor = client$1;
                }
                catch (err) {
                    ready = null;
                    throw wrapDialError("bootstrap", err);
                }
            })();
        }
        try {
            await ready;
        }
        catch (err) {
            throw err instanceof Error && err.message.startsWith("tor ")
                ? err
                : wrapDialError("bootstrap", err);
        }
        if (!tor)
            throw new Error("tor client failed to start");
        return tor;
    }
    async function makeExitCircuit(client, signal) {
        try {
            return await buildExitCircuit.buildExitCircuit(client, signal, {
                extendTimeoutMs,
                attempts: circuitAttempts,
            });
        }
        catch (err) {
            throw err instanceof Error && err.message.startsWith("tor ")
                ? err
                : wrapDialError("extend circuit", err);
        }
    }
    return {
        async dial(host, port, signal = new AbortController().signal) {
            let client = await ensureTor(signal);
            let circuit;
            try {
                circuit = await makeExitCircuit(client, signal);
            }
            catch (err) {
                if (isDestroyedCircuitError(err) && !signal.aborted) {
                    resetTor();
                    client = await ensureTor(signal);
                    circuit = await makeExitCircuit(client, signal);
                }
                else {
                    throw err instanceof Error && err.message.startsWith("tor ")
                        ? err
                        : wrapDialError("extend circuit", err);
                }
            }
            try {
                const openSignal = AbortSignal.any([
                    signal,
                    AbortSignal.timeout(openTimeoutMs),
                ]);
                const stream = await circuit.openOrThrow(host, port, { wait: true }, openSignal);
                return bindCircuitLifetime(stream, circuit);
            }
            catch (err) {
                try {
                    await circuit.close();
                }
                catch {
                    // ignore
                }
                throw wrapDialError(`open ${host}:${port}`, err);
            }
        },
        async dispose() {
            disposed = true;
            resetTor();
        },
    };
}

exports.createExitDialer = createExitDialer;
//# sourceMappingURL=exit-dialer.cjs.map
