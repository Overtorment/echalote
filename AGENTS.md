# AGENTS.md — echalote (Overtorment fork)

Guidance for AI agents and humans working in this repo. Consumer-facing docs live in `README.md`.

## What this is

Bun-first fork of [hazae41/echalote](https://github.com/hazae41/echalote): Tor client protocol in TypeScript. Package exports point at **`src/`** (no Rollup/`dist` build).

Primary happy path for consumers:

`createMeekStream` → `TorClientDuplex` → `buildExitCircuit` → `circuit.openOrThrow(host, port)`

## Commands

```bash
bun install
bun run test:unit          # tests/unit — offline, required
bun run test:integration   # tests/integration — live Tor, needs network
```

CI: `.github/workflows/ci.yml` — jobs `unit` and `integration`.

Do **not** add `build` / `prepare` / Rollup back unless explicitly requested.

## Layout

| Path | Purpose |
|------|---------|
| `src/mods/meek/` | Meek transport; `DEFAULT_MEEK_URL` = CDN77 |
| `src/mods/tor/client.ts` | `TorClientDuplex`; calls `initBundledCrypto()` |
| `src/mods/tor/circuit.ts` | Circuit create/extend/open primitives |
| `src/mods/tor/directory/` | Clearnet consensus/microdesc + `buildExitCircuit` |
| `src/mods/crypto/` | Noble/WebCrypto adapters |
| `src/libs/aes/`, `src/libs/rsa/` | Drop-in replacements for hazae41 WASM |
| `tests/unit/` | Unit + frozen wasm vectors under `tests/unit/vectors/` |
| `tests/integration/` | Live meek → exit → HTTPS check |
| `scripts/fix-hazae41-x509.mjs` | `postinstall` export-path fix |

## Hard constraints

1. **Meek URL** — Never restore `meek.azureedge.net`. Use CDN77 (`DEFAULT_MEEK_URL`).
2. **Directory over meek** — Full consensus via Tor/meek truncates (~3.5MB). Use clearnet `fetchMicrodescConsensus` / `fetchMicrodesc`, then extend on Tor.
3. **Hazae41 pins** — Keep cursor **1.x**, mutex **2.1.x**, asn1 **&lt; 1.3.32**, binary **1.3.5**, smux/kcp **1.1.3**. Contracts are enforced in `tests/unit/deps-contracts.test.ts`. Use `overrides` when adding deps.
4. **`@hazae41/bytes` `Uint8Array`** — Types may list it; runtime ESM does **not** export a value. Always `import type { Uint8Array }` (or `type` in a mixed import). Never value-import `Uint8Array` from that package.
5. **AES-CTR** — Must keep mid-block keystream offset (Tor RELAY payloads are 509 bytes). Vectors in `tests/unit/vectors/aes-ctr-wasm.json`. Do not re-add `@hazae41/aes.wasm` / `rsa.wasm` as runtime deps; fixtures only.
6. **X25519** — Use Noble (`initBundledCrypto`). Bun native WebCrypto rejects many valid ntor keys.
7. **No Lefthook in `~`** — This machine’s home git repo must not get Lefthook; do not install hooks there.

## When changing crypto or circuits

- Prefer characterization / differential tests before swaps.
- AES/RSA: update or regenerate vectors under `tests/unit/vectors/` if behavior intentionally changes; prove against known good outputs.
- After circuit/directory changes, run `bun run test:integration` (or rely on CI).
- Keep `buildExitCircuit` as the shared high-level API; do not duplicate that loop in consumers when this package can own it.

## Style

- Match existing hazae41-ish TypeScript patterns in `src/` (OrThrow, duplex pipes, minimal deps).
- Do not expand scope into onion-service (HS) client unless asked.
- Do not commit secrets. Do not force-push `master`.

## Upstream vs fork

Fork goals: reliable Bun + meek + clearnet-dir circuits for apps like helix3. Snowflake and in-Tor `Consensus.fetchOrThrow` remain but are not the recommended path over meek.
