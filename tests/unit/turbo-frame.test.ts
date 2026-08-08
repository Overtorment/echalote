import { Opaque, Readable, Writable } from "@hazae41/binary";
import { Bytes } from "@hazae41/bytes";
import { describe, expect, test } from "@jest/globals";
import { TurboFrame } from "../../src/mods/snowflake/turbo/frame.ts";

describe("TurboFrame", () => {
  test("round-trips fragment bytes", () => {
    const fragment = new Opaque(Bytes.random(130));
    const frame = TurboFrame.createOrThrow({ padding: false, fragment });
    const bytes = Writable.writeToBytesOrThrow(frame);
    const frame2 = Readable.readFromBytesOrThrow(TurboFrame, bytes);

    expect(Bytes.equals2(frame.fragment.bytes, frame2.fragment.bytes)).toBe(true);
  });
});
