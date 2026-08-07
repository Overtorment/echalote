/**
 * Contracts helix3 / Bun need from hazae41 transitive deps.
 * These catch the Cursor 2.x / Mutex 2.2.x upgrades that break echalote at runtime.
 */
import { describe, expect, test } from "bun:test";
import { Mutex } from "@hazae41/mutex";
import { Cursor } from "@hazae41/cursor";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function pkgVersion(name: string): string {
  const pkg = JSON.parse(
    readFileSync(join(root, "node_modules", name, "package.json"), "utf8"),
  );
  return pkg.version as string;
}

describe("hazae41 dependency contracts", () => {
  test("cursor exposes readUint8OrThrow (1.x API, not 2.x)", () => {
    const c = new Cursor(new Uint8Array([0x30]));
    expect(typeof c.readUint8OrThrow).toBe("function");
    expect(c.readUint8OrThrow()).toBe(0x30);
    // Cursor 2.x renamed these to readUint8 without OrThrow
    expect(pkgVersion("@hazae41/cursor").startsWith("1.")).toBe(true);
  });

  test("mutex exposes .inner (2.1.x API, not 2.2.x .value-only)", () => {
    const m = new Mutex(new Map<number, string>());
    expect(m.inner).toBeInstanceOf(Map);
    expect(typeof m.runOrWait).toBe("function");
    const majorMinor = pkgVersion("@hazae41/mutex").split(".").slice(0, 2).join(".");
    expect(majorMinor).toBe("2.1");
  });

  test("asn1 stays on the cursor-1.x line (< 1.3.32)", () => {
    const v = pkgVersion("@hazae41/asn1");
    const [maj, min, patch] = v.split(".").map(Number);
    expect(maj).toBe(1);
    expect(min).toBe(3);
    expect(patch!).toBeLessThan(32);
  });

  test("binary stays on cursor-1.x line (1.3.5)", () => {
    expect(pkgVersion("@hazae41/binary")).toBe("1.3.5");
  });

  test("smux and kcp stay on cursor-1.x line (1.1.3)", () => {
    expect(pkgVersion("@hazae41/smux")).toBe("1.1.3");
    expect(pkgVersion("@hazae41/kcp")).toBe("1.1.3");
  });

  test("x509 is importable (export paths match tarball layout)", async () => {
    const x509 = await import("@hazae41/x509");
    expect(x509.Certificate).toBeDefined();
  });
});
