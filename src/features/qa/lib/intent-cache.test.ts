import { describe, expect, it } from "vitest";
import { intentVersion, normalizeQuestion } from "./intent-cache";

describe("normalizeQuestion", () => {
  it("removes extra spaces and keeps capital letters", () => {
    expect(normalizeQuestion("  Berapa   Dana Desa? ")).toBe("Berapa Dana Desa?");
  });
});

describe("intentVersion", () => {
  it("changes when the prompt changes", () => {
    expect(intentVersion("aturan A")).not.toBe(intentVersion("aturan B"));
    expect(intentVersion("aturan A")).toBe(intentVersion("aturan A"));
  });
});
