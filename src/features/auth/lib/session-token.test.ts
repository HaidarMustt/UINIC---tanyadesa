import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./session-token";

const SECRET = "test-secret-yang-panjangnya-lebih-dari-32-karakter";

describe("session token", () => {
  it("round-trips the user id", async () => {
    const token = await signSessionToken({ userId: "user_1" }, SECRET);
    expect(await verifySessionToken(token, SECRET)).toEqual({ userId: "user_1" });
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSessionToken({ userId: "user_1" }, SECRET);
    expect(await verifySessionToken(token, "secret-lain-yang-juga-panjangnya-32-karakter")).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken({ userId: "user_1" }, SECRET);
    const [header, , signature] = token.split(".");
    const fakeBody = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
    expect(await verifySessionToken(`${header}.${fakeBody}.${signature}`, SECRET)).toBeNull();
  });

  it("refuses a short secret", async () => {
    await expect(signSessionToken({ userId: "user_1" }, "pendek")).rejects.toThrow();
  });
});
