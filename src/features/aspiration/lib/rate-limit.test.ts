import { describe, expect, it } from "vitest";
import {
  ASPIRATIONS_PER_DESA_PER_DAY,
  ASPIRATIONS_PER_IP_PER_HOUR,
  ASPIRATIONS_PER_SESSION_PER_HOUR,
  checkAspirationLimits,
} from "./rate-limit";

const quiet = { sessionLastHour: 0, ipLastHour: 0, desaToday: 0 };

describe("checkAspirationLimits", () => {
  it("allows under every limit", () => {
    expect(checkAspirationLimits(quiet).allowed).toBe(true);
  });

  it("blocks a busy browser, a busy IP and a busy desa", () => {
    expect(checkAspirationLimits({ ...quiet, sessionLastHour: ASPIRATIONS_PER_SESSION_PER_HOUR }).allowed).toBe(false);
    expect(checkAspirationLimits({ ...quiet, ipLastHour: ASPIRATIONS_PER_IP_PER_HOUR }).allowed).toBe(false);
    expect(checkAspirationLimits({ ...quiet, desaToday: ASPIRATIONS_PER_DESA_PER_DAY }).allowed).toBe(false);
  });
});
