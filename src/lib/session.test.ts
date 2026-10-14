import { describe, expect, it } from "vitest";
import { getOrCreateSessionId } from "./session";

const request = (cookie?: string) =>
  new Request("http://test", { headers: cookie ? { cookie } : {} });

describe("getOrCreateSessionId", () => {
  it("reuses a valid session id from the cookie", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const result = getOrCreateSessionId(request(`other=1; td_sid=${id}`));

    expect(result).toEqual({ sessionId: id, setCookie: null });
  });

  it("creates a new httpOnly cookie when none exists", () => {
    const result = getOrCreateSessionId(request());

    expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.setCookie).toContain("HttpOnly");
  });

  it("ignores a tampered cookie value", () => {
    const result = getOrCreateSessionId(request("td_sid=<script>"));

    expect(result.sessionId).not.toBe("<script>");
    expect(result.setCookie).not.toBeNull();
  });
});
