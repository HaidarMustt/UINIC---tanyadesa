import { describe, expect, it } from "vitest";
import { TrackingCodeSchema } from "../schemas";
import { generateTrackingCode, normalizeTrackingCode, TRACKING_CODE_LENGTH } from "./tracking-code";

describe("generateTrackingCode", () => {
  it("makes codes that pass validation", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateTrackingCode();
      expect(code).toHaveLength(TRACKING_CODE_LENGTH);
      expect(TrackingCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it("does not repeat in practice", () => {
    const codes = new Set(Array.from({ length: 1000 }, generateTrackingCode));
    expect(codes.size).toBe(1000);
  });
});

describe("normalizeTrackingCode", () => {
  it("accepts a code as written", () => {
    expect(normalizeTrackingCode("k7m2pq9x")).toBe("k7m2pq9x");
  });

  it("ignores capitals, spaces and dashes", () => {
    expect(normalizeTrackingCode("  K7M2 PQ9X ")).toBe("k7m2pq9x");
    expect(normalizeTrackingCode("k7m2-pq9x")).toBe("k7m2pq9x");
  });

  it("takes the code out of a pasted tracking link", () => {
    expect(normalizeTrackingCode("https://uinic-tanyadesa.vercel.app/desa/sukamaju/aspirasi/k7m2pq9x?baru=1")).toBe(
      "k7m2pq9x",
    );
    expect(normalizeTrackingCode("/desa/sukamaju/aspirasi/k7m2pq9x")).toBe("k7m2pq9x");
  });

  it("rejects text that cannot be a code", () => {
    expect(normalizeTrackingCode("")).toBeNull();
    expect(normalizeTrackingCode("k7m2pq9")).toBeNull(); // too short
    expect(normalizeTrackingCode("k7m2pq9xy")).toBeNull(); // too long
    expect(normalizeTrackingCode("k0m1pq9x")).toBeNull(); // 0 and 1 are never used
    expect(normalizeTrackingCode("k7m2pq9!")).toBeNull();
  });

  it("accepts every code the generator makes", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateTrackingCode();
      expect(normalizeTrackingCode(code.toUpperCase())).toBe(code);
    }
  });
});
