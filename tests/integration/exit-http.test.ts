/**
 * Live integration: createExitDialer → HTTPS check.torproject.org/api/ip
 * Requires outbound network (CDN77 meek, directory authorities, exit traffic).
 */
import { describe, expect, test } from "@jest/globals";
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas";
import {
  asBytesDuplex,
  asOpaqueDuplex,
  createExitDialer,
  streamFetch,
} from "../../src/mods/index.ts";

const OVERALL_MS = 120_000;
const ATTEMPTS = 3;

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
      const overall = AbortSignal.timeout(OVERALL_MS);
      let lastError: unknown;
      for (let i = 1; i <= ATTEMPTS; i++) {
        if (overall.aborted) break;
        try {
          const { IsTor, IP } = await checkTorIp(overall);
          if (!IP) throw new Error("empty IP");
          if (!IsTor) throw new Error(`IsTor=false IP=${IP} (attempt ${i}/${ATTEMPTS})`);
          expect(IsTor).toBe(true);
          expect(IP.length).toBeGreaterThan(0);
          return;
        } catch (err) {
          lastError = err;
          if (overall.aborted) break;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new Error(`integration failed: ${String(lastError)}`, { cause: lastError });
    },
    OVERALL_MS + 30_000,
  );
});
