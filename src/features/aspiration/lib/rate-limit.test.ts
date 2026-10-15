import { describe, expect, it } from "vitest";
import { ASPIRATIONS_PER_DESA_PER_DAY, ASPIRATIONS_PER_SESSION_PER_HOUR, checkAspirationLimits } from "./rate-limit";

describe("checkAspirationLimits", () => {
  it("allows under both limits", () => {
    expect(checkAspirationLimits(0, 0).allowed).toBe(true);
  });

  it("blocks a busy session and a busy desa", () => {
    expect(checkAspirationLimits(ASPIRATIONS_PER_SESSION_PER_HOUR, 0).allowed).toBe(false);
    expect(checkAspirationLimits(0, ASPIRATIONS_PER_DESA_PER_DAY).allowed).toBe(false);
  });
});
