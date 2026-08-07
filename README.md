# @hazae41/echalote (Overtorment fork)

Zero-copy Tor client protocol in TypeScript. This fork targets **Node.js (npm) and Bun**: working meek defaults, pinned hazae41 deps, Noble crypto (no AES/RSA WASM), and helpers to build exit circuits with clearnet directory fetches.

Upstream: [hazae41/echalote](https://github.com/hazae41/echalote).

> **Experimental.** Treat as unsafe for high-threat use. APIs can change.

## Requirements

- **Node.js ≥ 24** (Active LTS)
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

Crypto helpers (`base16` / `base64` / `ed25519` / `sha1` / `x25519`) are normal dependencies — no separate peer install. Versions are pinned; do not upgrade casually.

`postinstall` runs `node scripts/fix-hazae41-x509.mjs` to patch `@hazae41/x509` export paths when needed.

## Quick start — exit stream over meek

Recommended path for clearnet destinations (`host:port` via a Tor exit):

```ts
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas"
import { fetch } from "@hazae41/fleche"
import { asOpaqueDuplex, createExitDialer } from "@hazae41/echalote"

const signal = AbortSignal.timeout(120_000)
const dialer = createExitDialer()

try {
  // Meek + exit circuit + RELAY_BEGIN (reuses Tor client across dials)
  const tcp = await dialer.dial("check.torproject.org", 443, signal)

  // `tcp.outer` is Uint8Array; wrap for Cadenas Opaque/Writable
  const opaque = asOpaqueDuplex(tcp.outer)
  const tls = new TlsClientDuplex({
    host_name: "check.torproject.org",
    ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384],
  })
  opaque.readable.pipeTo(tls.inner.writable).catch(() => {})
  tls.inner.readable.pipeTo(opaque.writable).catch(() => {})

  const res = await fetch("https://check.torproject.org/api/ip", {
    stream: tls.outer,
    signal,
    preventAbort: true,
    preventCancel: true,
    preventClose: true,
  })
  console.log(await res.json()) // { IsTor: true, IP: "..." }

  tcp.close() // also closes the exit circuit
} finally {
  await dialer.dispose()
}
```

Lower-level pieces (`createMeekStream`, `TorClientDuplex`, `buildExitCircuit`, `openOrThrow`) remain available if you need a custom pipeline.

## API overview

| Export | Role |
|--------|------|
| `createExitDialer(opts?)` | **Happy path:** meek + exit circuit + `dial(host, port)` → `TorStreamDuplex`. |
| `createMeekStream(url?)` | HTTP meek transport. Default `DEFAULT_MEEK_URL` (CDN77). |
| `DEFAULT_MEEK_URL` | Current Tor Browser CDN77 meek backend. |
| `TorClientDuplex` | Tor protocol state machine. Pipe a transport duplex to `inner`. |
| `initBundledCrypto()` | Ed25519 (WebCrypto) + X25519/SHA-1 (@noble). Called from the client ctor. |
| `fetchMicrodescConsensus(signal?, opts?)` | Clearnet microdesc consensus from directory authorities. |
| `fetchMicrodesc(head, signal?, opts?)` | Clearnet microdescriptor body + digest check. |
| `buildExitCircuit(client, signal?, opts?)` | Create + extend middle + exit using the clearnet helpers above. |
| `Circuit` / `openOrThrow` | Open a stream to `hostname:port`. `stream.outer` is raw `Uint8Array`. |
| `asOpaqueDuplex(bytes)` | Wrap a Uint8Array duplex for hazae41 Cadenas/Fleche (`Opaque`/`Writable`). |

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
npm install                 # also runs prepare → build
npm run build               # rollup → dist/esm, dist/cjs, dist/types
bun run test:unit           # Bun test runner
npm run test:unit:node      # Jest on Node (same tests)
bun run test:integration
npm run test:integration:node
```

Tests use `@jest/globals`. Bun rewrites those imports to its runner; npm CI runs Jest. Layout: `tests/unit/`, `tests/integration/`.

## Privacy / threat model (short)

- **Exit traffic:** destination sees the Tor exit address.  
- **Meek CDN + clearnet DAs:** see the client IP.  
- **No onion-service (HS) client** in this library.  
- TLS via Cadenas is the upstream “unsafe TLS” stack — validate what you need for your threat model.

## License

MIT (see `LICENSE.md`).
