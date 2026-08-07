import { describe, expect, test } from "bun:test";
import {
  DEFAULT_MEEK_URL,
  createMeekStream,
} from "../../src/mods/meek/meek.ts";

describe("createMeekStream (characterization)", () => {
  test("returns a BatchedFetchStream with the given URL and session header", async () => {
    const url = "https://example.test/meek/";
    const stream = await createMeekStream(url);
    expect(stream.request).toBeInstanceOf(Request);
    const req = stream.request as Request;
    expect(req.url).toBe(url);
    expect(req.headers.get("x-session-id")).toBeTruthy();
    // Constructor starts the fetch loop; tear down so the test process can exit.
    stream.duplex.error(new Error("test teardown"));
  });

  test("each call gets a distinct x-session-id", async () => {
    const a = await createMeekStream("https://example.test/a/");
    const b = await createMeekStream("https://example.test/b/");
    const idA = (a.request as Request).headers.get("x-session-id");
    const idB = (b.request as Request).headers.get("x-session-id");
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);
    a.duplex.error(new Error("test teardown"));
    b.duplex.error(new Error("test teardown"));
  });
});

describe("meek defaults (CDN77)", () => {
  test("DEFAULT_MEEK_URL points at the live Tor CDN77 meek backend", () => {
    expect(DEFAULT_MEEK_URL).toBe("https://1603026938.rsc.cdn77.org/");
  });

  test("DEFAULT_MEEK_URL is not the retired Azure endpoint", () => {
    expect(DEFAULT_MEEK_URL).not.toContain("azureedge.net");
    expect(DEFAULT_MEEK_URL).not.toContain("meek.azureedge.net");
  });

  test("createMeekStream() with no URL uses DEFAULT_MEEK_URL", async () => {
    const stream = await createMeekStream();
    expect((stream.request as Request).url).toBe(DEFAULT_MEEK_URL);
    stream.duplex.error(new Error("test teardown"));
  });
});
