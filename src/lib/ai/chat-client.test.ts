import { describe, expect, it } from "vitest";
import { isSchemaMismatch } from "./chat-client";

describe("isSchemaMismatch", () => {
  it("recognises the provider's schema error", () => {
    // Real error seen in the eval on 16 Oct 2026 (shortened).
    const body = '{"error":{"message":"Generated JSON does not match the expected schema. Please adjust your prompt.","code":"json_validate_failed"}}';
    expect(isSchemaMismatch(body)).toBe(true);
  });

  it("does not retry other bad requests", () => {
    expect(isSchemaMismatch('{"error":{"message":"Invalid API key"}}')).toBe(false);
  });
});
