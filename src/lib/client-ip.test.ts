import { describe, expect, it } from "vitest";
import { getClientIp, hashIp } from "./client-ip";

describe("client ip", () => {
  it("takes the first forwarded address", () => {
    const request = new Request("http://x", { headers: { "x-forwarded-for": "36.1.2.3, 10.0.0.1" } });
    expect(getClientIp(request)).toBe("36.1.2.3");
  });

  it("returns null when there is no address", () => {
    expect(getClientIp(new Request("http://x"))).toBeNull();
  });

  it("hashes the same ip the same way, and hides it", () => {
    const hash = hashIp("36.1.2.3", "salt");
    expect(hash).toBe(hashIp("36.1.2.3", "salt"));
    expect(hash).not.toContain("36.1.2.3");
    expect(hashIp("36.1.2.3", "salt-lain")).not.toBe(hash);
  });
});
