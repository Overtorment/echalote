# AGENTS.md — echalote (Overtorment fork)

Guidance for AI agents and humans working in this repo. Consumer-facing docs live in `README.md`.

## What this is

Fork of [hazae41/echalote](https://github.com/hazae41/echalote) for **Bun** (and Jest-on-Node tests). Package exports TypeScript source from `src/` (same pattern as bip157/bip158). No Rollup/`dist` build step.

Primary happy path:

`createExitDialer()` → `dialer.dial(host, port)` → `stream.outer` (Uint8Array)

Lower-level: `createMeekStream` → `TorClientDuplex` → `buildExitCircuit` → `openOrThrow`.

## Commands

```bash
npm install                 # postinstall → node x509 fix
bun run test:unit           # Bun runner (rewrites @jest/globals → bun:test)
npm run test:unit:node      # Jest on Node
bun run test:integration
npm run test:integration:node
bun run test:package        # npm pack + Bun consumer smoke
```

Tests import from `@jest/globals` (not `bun:test`). Bun’s runner rewrites that import; npm CI uses real Jest (`jest.config.cjs` + ts-jest).

CI: `.github/workflows/ci.yml` — four jobs:
- `unit-bun` / `integration-bun` — `bun install` + unit/package or integration
- `unit-npm` / `integration-npm` — `npm ci` + Jest

Keep `package-lock.json` and `bun.lock` in sync when changing deps.

**Engines:** Node `>=24` (Active LTS). Consumers that import this package should use **Bun** (TypeScript source exports).

## Layout

| Path | Purpose |
|------|---------|
| `src/mods/meek/` | Meek transport; `DEFAULT_MEEK_URL` = CDN77 |
| `src/mods/tor/client.ts` | `TorClientDuplex`; calls `initBundledCrypto()` |
| `src/mods/tor/circuit.ts` | Circuit create/extend/open primitives |
| `src/mods/tor/directory/` | Clearnet consensus/microdesc + `buildExitCircuit` + `createExitDialer` |
| `src/mods/crypto/` | Noble/WebCrypto adapters |
| `src/libs/aes/`, `src/libs/rsa/` | Drop-in replacements for hazae41 WASM |
| `src/libs/http/` | `streamFetch` — HTTP/1.1 over a Uint8Array duplex (no Fleche/WASM) |
| `tests/unit/` | Unit + frozen wasm vectors under `tests/unit/vectors/` |
| `tests/integration/` | Live meek → exit → HTTPS check |
| `tests/package/` | Pack + consumer smoke (bip157-style) |
| `scripts/fix-hazae41-x509.mjs` | `postinstall` (must stay **node**-runnable) |

## Hard constraints

1. **Meek URL** — Never restore `meek.azureedge.net`. Use CDN77 (`DEFAULT_MEEK_URL`).
2. **Directory over meek** — Full consensus via Tor/meek truncates (~3.5MB). Use clearnet `fetchMicrodescConsensus` / `fetchMicrodesc`, then extend on Tor.
3. **Hazae41 pins** — Keep cursor **1.x**, mutex **2.1.x**, asn1 **&lt; 1.3.32**, binary **1.3.5**. Crypto helpers (`base16`/`base64`/`ed25519`/`sha1`/`x25519`) are **dependencies**, not peers. Contracts in `tests/unit/deps-contracts.test.ts`. Use `overrides`.
4. **`@hazae41/bytes` `Uint8Array`** — Runtime ESM does **not** export a value. Always `import type { Uint8Array }`.
5. **AES-CTR** — Mid-block keystream offset required (509-byte RELAY payloads). Vectors in `tests/unit/vectors/aes-ctr-wasm.json`. No runtime aes/rsa WASM.
6. **X25519** — Noble via `initBundledCrypto` (native WebCrypto often rejects ntor keys).
7. **TypeScript source exports** — `package.json` points at `./src/index.ts`. Use relative `.ts` imports inside `src/` (no `mods/*` / `libs/*` path aliases, no Rollup/`dist`).
8. **`postinstall` stays Node-runnable** — Do not make lifecycle scripts Bun-only.
9. **No Lefthook in `~`** — Do not install Lefthook hooks in the home git repo.

## When changing crypto or circuits

- Prefer characterization tests before swaps; keep wasm vector fixtures.
- After circuit/directory changes, run `bun run test:integration` (or CI).
- Prefer `createExitDialer` for consumers; keep `buildExitCircuit` for custom pipelines.
- `TorStreamDuplex.outer` is raw `Uint8Array`. Use `streamFetch` for HTTP over that duplex. Use `asOpaqueDuplex` / `asBytesDuplex` only for Cadenas TLS piping.
- After entrypoint changes, run `bun run test:package` and verify a Bun consumer can `import` from `@hazae41/echalote`.

## Style

- Match existing TypeScript patterns in `src/` (OrThrow, duplex pipes).
- Do not expand into onion-service (HS) client unless asked.
- Do not commit secrets. Do not force-push `master`.
