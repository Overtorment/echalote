/**
 * Pack the package, install the tarball in a temp consumer, import via Bun.
 * Catches broken exports / shipping dist / wrong entrypoint.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { accessSync, constants, readFileSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function resolveNpm() {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, "npm");
    try {
      accessSync(candidate, constants.X_OK);
      const real = realpathSync(candidate);
      if (real.endsWith("/bun") || real.endsWith("\\bun.exe")) continue;
      if (readFileSync(candidate, "utf8").slice(0, 64).includes("bun")) continue;
      return candidate;
    } catch {
      // keep looking
    }
  }
  return "npm";
}

function run(command, args, cwd = packageRoot) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_ignore_scripts: "true", NO_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  }
  return result.stdout.trim();
}

function parseNpmPackJson(stdout) {
  const match = stdout.match(/\[[\u0009\u0020\r\n]*\{[\s\S]*\}\s*\]\s*$/);
  if (!match) {
    throw new Error(`npm pack --json missing JSON array:\n${stdout.slice(-400)}`);
  }
  return JSON.parse(match[0]);
}

const tempRoot = await mkdtemp(join(tmpdir(), "echalote-package-smoke-"));
try {
  const packDir = join(tempRoot, "pack");
  await mkdir(packDir);

  const [packResult] = parseNpmPackJson(
    run(resolveNpm(), [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      packDir,
    ]),
  );
  const packed = packResult.files.map(({ path }) => path);
  assert.ok(packed.includes("src/index.ts"), "pack must include src/index.ts");
  assert.ok(
    !packed.some((path) => path === "dist" || path.startsWith("dist/")),
    "pack must not include dist/",
  );

  const tarballPath = resolve(packDir, packResult.filename);
  const consumerDir = join(tempRoot, "consumer");
  await mkdir(consumerDir);
  await writeFile(
    join(consumerDir, "package.json"),
    JSON.stringify({
      name: "echalote-package-smoke-consumer",
      private: true,
      type: "module",
    }),
  );
  run(
    resolveNpm(),
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      "--no-save",
      tarballPath,
    ],
    consumerDir,
  );

  const consumerScript = join(consumerDir, "smoke.mjs");
  await writeFile(
    consumerScript,
    String.raw`import assert from "node:assert/strict";
import {
  DEFAULT_MEEK_URL,
  createExitDialer,
  initBundledCrypto,
} from "@hazae41/echalote";

assert.match(
  import.meta.resolve("@hazae41/echalote"),
  /\/node_modules\/@hazae41\/echalote\/src\/index\.ts$/,
);
assert.equal(DEFAULT_MEEK_URL, "https://1603026938.rsc.cdn77.org/");
assert.ok(!DEFAULT_MEEK_URL.includes("azureedge.net"));

await initBundledCrypto();

const dialer = createExitDialer();
assert.equal(typeof dialer.dial, "function");
await dialer.dispose();
await dialer.dispose();
await assert.rejects(
  () => dialer.dial("example.com", 80, AbortSignal.timeout(1000)),
  /disposed/i,
);

console.log("package smoke ok");
`,
  );
  console.log(run("bun", [consumerScript], consumerDir));
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}
