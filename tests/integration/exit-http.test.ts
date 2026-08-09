/**
 * Live integration: createExitDialer → HTTPS check.torproject.org/api/ip
 * Requires outbound network (CDN77 meek, directory authorities, exit traffic).
 */
import assert from "node:assert/strict";
import { describe, test } from "@jest/globals";
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas";
import {
  asBytesDuplex,
  asOpaqueDuplex,
  createExitDialer,
  streamFetch,
} from "../../src/mods/index.ts";

const OVERALL_MS = 120_000;

// Trace unexpected assert.ok(false) failures seen on GHA npm Jest.
const _ok = assert.ok.bind(assert);
assert.ok = ((value: unknown, message?: string | Error) => {
  if (!value) {
    console.error(
      "[exit-http] assert.ok(false)",
      message ?? "",
      new Error("assert.ok stack").stack,
    );
  }
  return _ok(value as any, message as any);
}) as typeof assert.ok;

async function checkTorIp(signal: AbortSignal): Promise<{ IsTor: boolean; IP: string }> {
  const dialer = createExitDialer();
  try {
    const tcp = await dialer.dial("check.torproject.org", 443, signal);
    try {
      const opaque = asOpaqueDuplex(tcp.outer);
      const tls = new TlsClientDuplex({
        host_name: "check.torproject.org",
        ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384],
      });
      opaque.readable.pipeTo(tls.inner.writable).catch(() => {});
      tls.inner.readable.pipeTo(opaque.writable).catch(() => {});

      const res = await streamFetch("https://check.torproject.org/api/ip", {
        stream: asBytesDuplex(tls.outer),
        signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { IsTor?: boolean; IP?: string };
      if (typeof body.IsTor !== "boolean" || typeof body.IP !== "string" || !body.IP) {
        throw new Error(`unexpected body: ${JSON.stringify(body)}`);
      }
      return { IsTor: body.IsTor, IP: body.IP };
    } finally {
      try {
        tcp.close();
      } catch {
        // ignore
      }
    }
  } finally {
    await dialer.dispose();
  }
}

describe("integration: Tor exit HTTP", () => {
  test(
    "meek circuit reaches check.torproject.org with IsTor=true",
    async () => {
      const deadline = Date.now() + OVERALL_MS;
      let lastError: unknown;
      let attempt = 0;
      const seenIps: string[] = [];

      while (Date.now() < deadline) {
        attempt++;
        const attemptSignal = AbortSignal.timeout(
          Math.min(45_000, Math.max(5_000, deadline - Date.now())),
        );
        try {
          console.error(`[exit-http] attempt ${attempt} start`);
          const { IsTor, IP } = await checkTorIp(attemptSignal);
          seenIps.push(IP);
          console.error(`[exit-http] attempt ${attempt} IP=${IP} IsTor=${IsTor}`);
          // Use assert.ok with message so GHA logs show the exit IP.
          assert.ok(IsTor, `IsTor=false IP=${IP} attempt=${attempt} seen=${seenIps.join(",")}`);
          return;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[exit-http] attempt ${attempt} failed: ${msg}`);
          if (Date.now() >= deadline) break;
          await new Promise((r) => setTimeout(r, 750));
        }
      }

      throw new Error(
        `integration failed after ${attempt} attempt(s); exitIPs=${seenIps.join(",") || "(none)"}; last=${
          lastError instanceof Error ? lastError.message : String(lastError)
        }`,
        { cause: lastError },
      );
    },
    OVERALL_MS + 60_000,
  );
});
