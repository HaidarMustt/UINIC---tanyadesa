import { describe, expect, it } from "vitest";
import { isSuccessfulVerification, verifyTurnstileToken } from "./turnstile";

describe("turnstile", () => {
  it("accepts only an explicit success", () => {
    expect(isSuccessfulVerification({ success: true })).toBe(true);
    expect(isSuccessfulVerification({ success: false, "error-codes": ["invalid-input-response"] })).toBe(false);
    expect(isSuccessfulVerification({ success: "true" })).toBe(false);
    expect(isSuccessfulVerification(null)).toBe(false);
  });

  it("rejects a missing token without calling Cloudflare", async () => {
    expect(await verifyTurnstileToken(null, null)).toBe(false);
  });
});
