/**
 * Live integration: createExitDialer → HTTPS check.torproject.org/api/ip
 * Requires outbound network (CDN77 meek, directory authorities, exit traffic).
 */
import { describe, test } from "@jest/globals";
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas";
import {
  asBytesDuplex,
  asOpaqueDuplex,
  createExitDialer,
  streamFetch,
} from "../../src/mods/index.ts";

const OVERALL_MS = 120_000;

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

async function clearnetCheck(signal: AbortSignal): Promise<{ IsTor?: boolean; IP?: string }> {
  const res = await fetch("https://check.torproject.org/api/ip", {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
  });
  if (!res.ok) throw new Error(`clearnet HTTP ${res.status}`);
  return (await res.json()) as { IsTor?: boolean; IP?: string };
}

describe("integration: Tor exit HTTP", () => {
  test(
    "meek circuit reaches check.torproject.org with IsTor=true",
    async () => {
      const overall = AbortSignal.timeout(OVERALL_MS);
      let lastError: unknown;
      let attempt = 0;
      const seenIps = new Set<string>();

      while (!overall.aborted) {
        attempt++;
        try {
          const { IsTor, IP } = await checkTorIp(overall);
          seenIps.add(IP);
          if (!IsTor) {
            throw new Error(`IsTor=false IP=${IP} (attempt ${attempt})`);
          }
          return;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[exit-http] attempt ${attempt} failed: ${msg}`);
          if (overall.aborted) break;
          // Brief pause so the next circuit can pick a different exit.
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      let clearnet = "";
      try {
        const c = await clearnetCheck(AbortSignal.timeout(10_000));
        clearnet = ` clearnetIP=${c.IP} clearnetIsTor=${c.IsTor}`;
        for (const ip of seenIps) {
          if (ip === c.IP) {
            clearnet += " LEAK:torIP==clearnetIP";
            break;
          }
        }
      } catch (e) {
        clearnet = ` clearnetCheckFailed=${e instanceof Error ? e.message : String(e)}`;
      }

      const detail = lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(
        `integration failed after ${attempt} attempt(s): ${detail}; exitIPs=${[...seenIps].join(",") || "(none)"};${clearnet}`,
        { cause: lastError },
      );
    },
    OVERALL_MS + 30_000,
  );
});
