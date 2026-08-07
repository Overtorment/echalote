# @hazae41/echalote (Overtorment fork)

Zero-copy Tor client protocol in TypeScript. This fork targets **Node.js (npm) and Bun**: working meek defaults, pinned hazae41 deps, Noble crypto (no AES/RSA WASM), and helpers to build exit circuits with clearnet directory fetches.

Upstream: [hazae41/echalote](https://github.com/hazae41/echalote).

> **Experimental.** Treat as unsafe for high-threat use. APIs can change.

## Requirements

- **Node.js ≥ 20** (WebCrypto Ed25519, native `fetch`)
- Or **Bun** (same APIs; tests use Bun)

Published package is compiled JS under `dist/` (ESM + CJS + types). `npm install` / `bun install` from git/`file:` runs `prepare` → `npm run build`.

## Install

```bash
npm install github:Overtorment/echalote
# or
bun add github:Overtorment/echalote
# local checkout:
npm install file:../echalote
```

Peer crypto packages (versions are pinned — do not upgrade casually):

```bash
npm install @hazae41/base16@1.0.18 @hazae41/base64@1.0.15 \
  @hazae41/ed25519@2.1.21 @hazae41/sha1@1.1.14 @hazae41/x25519@2.2.9
```

`postinstall` runs `node scripts/fix-hazae41-x509.mjs` to patch `@hazae41/x509` export paths when needed.

## Quick start — exit stream over meek

Recommended path for clearnet destinations (`host:port` via a Tor exit):

1. Meek transport → Tor client  
2. `buildExitCircuit` (clearnet consensus/microdescs + Tor extends)  
3. `circuit.openOrThrow(host, port)`  
4. Optional TLS/HTTP with [Cadenas](https://github.com/hazae41/cadenas) + [Fleche](https://github.com/hazae41/fleche)

```ts
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { fetch } from "@hazae41/fleche"
import {
  TorClientDuplex,
  buildExitCircuit,
  createMeekStream,
} from "@hazae41/echalote"

const signal = AbortSignal.timeout(120_000)

// 1) Meek bridge (defaults to Tor CDN77; Azure meek is dead)
const meek = await createMeekStream()
const tor = new TorClientDuplex()
// TorClientDuplex constructor runs initBundledCrypto() for you.

meek.duplex.outer.readable.pipeTo(tor.inner.writable).catch(() => {})
tor.inner.readable.pipeTo(meek.duplex.outer.writable).catch(() => {})

await tor.waitOrThrow(signal)

// 2) 3-hop exit circuit (clearnet directory + Tor CREATE/EXTEND)
const circuit = await buildExitCircuit(tor, signal, {
  attempts: 3,
  extendTimeoutMs: 15_000,
})

// 3) RELAY_BEGIN to a clearnet host
const tcp = await circuit.openOrThrow(
  "check.torproject.org",
  443,
  { wait: true },
  AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
)

// 4) TLS + HTTP over that stream
const tls = new TlsClientDuplex({
  host_name: "check.torproject.org",
  ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384],
})
tcp.outer.readable.pipeTo(tls.inner.writable).catch(() => {})
tls.inner.readable.pipeTo(tcp.outer.writable).catch(() => {})

const res = await fetch("https://check.torproject.org/api/ip", {
  stream: tls.outer,
  signal,
  preventAbort: true,
  preventCancel: true,
  preventClose: true,
})
console.log(await res.json()) // { IsTor: true, IP: "..." }

tcp.close()
await circuit.close()
tor.close()
```

## API overview

| Export | Role |
|--------|------|
| `createMeekStream(url?)` | HTTP meek transport. Default `DEFAULT_MEEK_URL` (CDN77). |
| `DEFAULT_MEEK_URL` | Current Tor Browser CDN77 meek backend. |
| `TorClientDuplex` | Tor protocol state machine. Pipe a transport duplex to `inner`. |
| `initBundledCrypto()` | Ed25519 (WebCrypto) + X25519/SHA-1 (@noble). Called from the client ctor. |
| `fetchMicrodescConsensus(signal?, opts?)` | Clearnet microdesc consensus from directory authorities. |
| `fetchMicrodesc(head, signal?, opts?)` | Clearnet microdescriptor body + digest check. |
| `buildExitCircuit(client, signal?, opts?)` | Create + extend middle + exit using the clearnet helpers above. |
| `Circuit` / `openOrThrow` | Open a stream to `hostname:port` through the circuit. |

### `buildExitCircuit` options

```ts
type BuildExitCircuitOptions = {
  consensusUrls?: readonly string[] // DA consensus URLs
  extendTimeoutMs?: number          // default 15_000
  attempts?: number                 // rebuilds on destroyed circuit; default 3
  pickTries?: number                // microdesc fetch candidates; default 8
}
```

### Why clearnet directory?

Fetching the full ~3.5MB microdesc consensus **through meek** often truncates. This fork fetches consensus and microdesc bodies over clearnet HTTP, then builds the circuit on Tor. Remote peers you `openOrThrow` still see the **exit** IP, not yours — but directory authorities and the meek CDN see your IP.

### Lower-level / legacy

You can still `createOrThrow` + `extendOrThrow` yourself, or use in-Tor `Consensus.fetchOrThrow` / `Consensus.Microdesc.fetchOrThrow`. Prefer `buildExitCircuit` for reliability over meek.

Snowflake (`createWebSocketSnowflakeStream`) remains available; meek + `buildExitCircuit` is the supported happy path here.

## Crypto

| Algorithm | Implementation |
|-----------|----------------|
| Ed25519 | WebCrypto via `@hazae41/ed25519` |
| X25519 / SHA-1 | `@noble` (via `@hazae41/x25519` / `@hazae41/sha1` adapters) |
| AES-128-CTR (relay cells) | `@noble/ciphers` (`src/libs/aes`) |
| RSA PKCS#1 v1.5 unprefixed verify | BigInt + Node `crypto` SPKI (`src/libs/rsa`) |

No `@hazae41/aes.wasm` / `@hazae41/rsa.wasm`.

## Develop

```bash
npm install          # also runs prepare → build
npm run build        # rollup → dist/esm, dist/cjs, dist/types
bun run test:unit    # offline unit tests (Bun test runner)
bun run test:integration
```

Layout: `tests/unit/`, `tests/integration/`. CI runs both jobs on PRs.

## Privacy / threat model (short)

- **Exit traffic:** destination sees the Tor exit address.  
- **Meek CDN + clearnet DAs:** see the client IP.  
- **No onion-service (HS) client** in this library.  
- TLS via Cadenas is the upstream “unsafe TLS” stack — validate what you need for your threat model.

## License

MIT (see `LICENSE.md`).
