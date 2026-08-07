/**
 * @hazae41/x509 package.json exports disagree with the published tarball layout
 * across 1.2.x releases. Detect which files exist and rewrite exports.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function resolveLayout(pkgDir) {
  const flatEsm = join(pkgDir, "dist/esm/index.mjs");
  const nestedEsm = join(pkgDir, "dist/esm/src/index.mjs");
  const flatCjs = join(pkgDir, "dist/cjs/index.cjs");
  const nestedCjs = join(pkgDir, "dist/cjs/src/index.cjs");

  if (existsSync(flatEsm) && existsSync(flatCjs)) {
    return {
      main: "./dist/cjs/index.cjs",
      module: "./dist/esm/index.mjs",
      types: "./dist/types/index.d.ts",
      exports: {
        ".": {
          types: "./dist/types/index.d.ts",
          import: "./dist/esm/index.mjs",
          require: "./dist/cjs/index.cjs",
        },
      },
    };
  }
  if (existsSync(nestedEsm) && existsSync(nestedCjs)) {
    return {
      main: "./dist/cjs/src/index.cjs",
      module: "./dist/esm/src/index.mjs",
      types: "./dist/types/index.d.ts",
      exports: {
        ".": {
          types: "./dist/types/index.d.ts",
          import: "./dist/esm/src/index.mjs",
          require: "./dist/cjs/src/index.cjs",
        },
      },
    };
  }
  return null;
}

function patchPackageJson(pkgJsonPath) {
  if (!existsSync(pkgJsonPath)) return false;
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  if (pkg.name !== "@hazae41/x509") return false;

  const next = resolveLayout(join(pkgJsonPath, ".."));
  if (!next) return false;

  const alreadyOk =
    pkg.main === next.main &&
    pkg.module === next.module &&
    JSON.stringify(pkg.exports) === JSON.stringify(next.exports);
  if (alreadyOk) return false;

  Object.assign(pkg, next);
  writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return true;
}

const candidates = [join(root, "node_modules/@hazae41/x509/package.json")];
for (const name of readdirSync(join(root, "node_modules")).filter((n) =>
  n.startsWith("@"),
)) {
  const scoped = join(root, "node_modules", name);
  try {
    for (const pkg of readdirSync(scoped)) {
      const nested = join(scoped, pkg, "node_modules/@hazae41/x509/package.json");
      if (existsSync(nested)) candidates.push(nested);
    }
  } catch {
    // ignore
  }
}

let patched = 0;
for (const path of new Set(candidates)) {
  if (patchPackageJson(path)) {
    patched++;
    console.log(`fixed ${path}`);
  }
}
if (patched === 0) console.log("fix-hazae41-x509: nothing to patch");
