/**
 * Live integration: meek → exit circuit → HTTPS check.torproject.org/api/ip
 * Requires outbound network (CDN77 meek, directory authorities, exit traffic).
 */
import { describe, expect, test } from "@jest/globals";
import { Ciphers, TlsClientDuplex } from "@hazae41/cadenas";
import { fetch as flecheFetch } from "@hazae41/fleche";
import {
  TorClientDuplex,
  asOpaqueDuplex,
  buildExitCircuit,
  createMeekStream,
} from "../../src/mods/index.ts";

const OVERALL_MS = 120_000;
const ATTEMPTS = 3;

async function checkTorIp(signal: AbortSignal): Promise<{ IsTor: boolean; IP: string }> {
  const meek = await createMeekStream();
  const client = new TorClientDuplex();

  const pipeA = meek.duplex.outer.readable
    .pipeTo(client.inner.writable)
    .catch(() => {});
  const pipeB = client.inner.readable
    .pipeTo(meek.duplex.outer.writable)
    .catch(() => {});

  try {
    await client.waitOrThrow(signal);
    const circuit = await buildExitCircuit(client, signal, {
      attempts: 3,
      extendTimeoutMs: 15_000,
    });
    try {
      const tcp = await circuit.openOrThrow(
        "check.torproject.org",
        443,
        { wait: true },
        AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      );
      try {
        const tls = new TlsClientDuplex({
          host_name: "check.torproject.org",
          ciphers: [Ciphers.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384],
        });
        const opaque = asOpaqueDuplex(tcp.outer);
        opaque.readable.pipeTo(tls.inner.writable).catch(() => {});
        tls.inner.readable.pipeTo(opaque.writable).catch(() => {});

        const res = await flecheFetch("https://check.torproject.org/api/ip", {
          stream: tls.outer,
          signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
          preventAbort: true,
          preventCancel: true,
          preventClose: true,
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
      try {
        await circuit.close();
      } catch {
        // ignore
      }
    }
  } finally {
    try {
      client.close();
    } catch {
      // ignore
    }
    void pipeA;
    void pipeB;
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
        : new Error("integration failed", { cause: lastError });
    },
    OVERALL_MS + 30_000,
  );
});
