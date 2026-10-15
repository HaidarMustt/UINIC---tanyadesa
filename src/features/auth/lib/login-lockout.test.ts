import { describe, expect, it } from "vitest";
import { failureWindowStart, isLockedOut, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from "./login-lockout";

describe("login lockout", () => {
  const now = new Date("2026-10-15T10:00:00Z");

  it("locks after the maximum number of failures", () => {
    expect(isLockedOut(MAX_FAILED_LOGINS - 1)).toBe(false);
    expect(isLockedOut(MAX_FAILED_LOGINS)).toBe(true);
  });

  it("counts failures within the lockout window", () => {
    const start = failureWindowStart(now, null);
    expect(now.getTime() - start.getTime()).toBe(LOCKOUT_MINUTES * 60 * 1000);
  });

  it("starts counting again after a successful login", () => {
    const lastLogin = new Date("2026-10-15T09:55:00Z");
    expect(failureWindowStart(now, lastLogin)).toEqual(lastLogin);
  });
});
