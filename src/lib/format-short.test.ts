import { describe, expect, it } from "vitest";
import { formatRupiahShort } from "./format-short";

describe("formatRupiahShort", () => {
  it("writes billions and millions the way people say them", () => {
    expect(formatRupiahShort(1_491_000_000)).toBe("Rp1,49 miliar");
    expect(formatRupiahShort(790_000_000)).toBe("Rp790 juta");
    expect(formatRupiahShort(66_600_000)).toBe("Rp66,6 juta");
  });

  it("keeps small amounts exact and puts the minus first", () => {
    expect(formatRupiahShort(750_000)).toBe("Rp750.000");
    expect(formatRupiahShort(-15_000_000)).toBe("-Rp15 juta");
  });
});
