/**
 * Verify the published dist entrypoints load under Node (ESM + CJS).
 * Used by CI npm jobs.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const esm = await import(pathToFileURL(join(root, "dist/esm/src/index.mjs")).href);
for (const name of [
  "DEFAULT_MEEK_URL",
  "createMeekStream",
  "TorClientDuplex",
  "buildExitCircuit",
  "fetchMicrodescConsensus",
  "initBundledCrypto",
]) {
  if (esm[name] == null) throw new Error(`ESM missing export: ${name}`);
}
await esm.initBundledCrypto();

const require = createRequire(import.meta.url);
const cjs = require(join(root, "dist/cjs/src/index.cjs"));
if (typeof cjs.buildExitCircuit !== "function") {
  throw new Error("CJS missing buildExitCircuit");
}
if (cjs.DEFAULT_MEEK_URL !== esm.DEFAULT_MEEK_URL) {
  throw new Error("CJS/ESM DEFAULT_MEEK_URL mismatch");
}

console.log("smoke-node: ok", cjs.DEFAULT_MEEK_URL);
