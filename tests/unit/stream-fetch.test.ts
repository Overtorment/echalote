/**
 * streamFetch — HTTP/1.1 GET over a Uint8Array duplex.
 */
import { describe, expect, test } from "@jest/globals";
import { deflateSync } from "node:zlib";
import { streamFetch } from "../../src/libs/http/index.ts";

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Server duplex: capture request bytes; emit response in multiple readable chunks. */
function mockDuplex(responseChunks: Uint8Array[]): {
  stream: ReadableWritablePair<Uint8Array, Uint8Array>;
  requestText: () => Promise<string>;
} {
  const reqChunks: Uint8Array[] = [];
  let release!: () => void;
  const closed = new Promise<void>((resolve) => {
    release = resolve;
  });

  const writable = new WritableStream<Uint8Array>({
    write(chunk) {
      reqChunks.push(chunk);
    },
    close() {
      release();
    },
  });

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      await closed;
      for (const chunk of responseChunks) controller.enqueue(chunk);
      controller.close();
    },
  });

  return {
    stream: { readable, writable },
    async requestText() {
      await closed;
      return new TextDecoder().decode(
        reqChunks.reduce((a, c) => {
          const n = new Uint8Array(a.length + c.length);
          n.set(a);
          n.set(c, a.length);
          return n;
        }, new Uint8Array()),
      );
    },
  };
}

describe("streamFetch", () => {
  test("parses Content-Length JSON across fragmented reads", async () => {
    const body = '{"IsTor":true,"IP":"1.2.3.4"}';
    const full = utf8(
      `HTTP/1.1 200 OK\r\nContent-Length: ${body.length}\r\n\r\n${body}`,
    );
    // Split inside headers and inside body — not one buffer.
    const { stream, requestText } = mockDuplex([
      full.subarray(0, 12),
      full.subarray(12, 40),
      full.subarray(40),
    ]);

    const res = await streamFetch("https://check.torproject.org/api/ip", { stream });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ IsTor: true, IP: "1.2.3.4" });

    const req = (await requestText()).toLowerCase();
    expect(req.startsWith("get /api/ip http/1.1\r\n")).toBe(true);
    expect(req).toContain("host: check.torproject.org\r\n");
    expect(req).toContain("connection: close\r\n");
  });

  test("reassembles chunked body", async () => {
    const { stream } = mockDuplex([
      utf8("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n"),
      utf8("5\r\nhello\r\n"),
      utf8("6\r\n world\r\n0\r\n\r\n"),
    ]);

    const res = await streamFetch("http://localhost/x", { stream });
    expect(await res.text()).toBe("hello world");
  });

  test("inflates Tor .z zlib body without Content-Encoding", async () => {
    const plain = "onion-key\n-----BEGIN RSA PUBLIC KEY-----\n";
    const z = deflateSync(Buffer.from(plain));
    const head = utf8(`HTTP/1.1 200 OK\r\nContent-Length: ${z.length}\r\n\r\n`);
    const { stream } = mockDuplex([head, z]);

    const res = await streamFetch("http://localhost/tor/micro/d/abc.z", { stream });
    expect(await res.text()).toBe(plain);
  });

  test("honors Content-Length truncation", async () => {
    const { stream } = mockDuplex([
      utf8("HTTP/1.1 200 OK\r\nContent-Length: 4\r\n\r\nabcdEXTRA"),
    ]);
    const res = await streamFetch("http://localhost/", { stream });
    expect(await res.text()).toBe("abcd");
  });

  test("rejects response with no header terminator", async () => {
    const { stream } = mockDuplex([utf8("HTTP/1.1 200 OK\r\nContent-Length: 0\r\n")]);
    await expect(streamFetch("http://localhost/", { stream })).rejects.toThrow(
      /header terminator/,
    );
  });

  test("aborts while waiting for response", async () => {
    const stream = {
      writable: new WritableStream<Uint8Array>(),
      readable: new ReadableStream<Uint8Array>({
        // never enqueues — abort must win
        start() {},
      }),
    };
    const ac = new AbortController();
    const pending = streamFetch("http://localhost/", { stream, signal: ac.signal });
    ac.abort();
    await expect(pending).rejects.toThrow();
  });
});
