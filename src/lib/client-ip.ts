// The sender's IP address, used only for rate limiting.
// We store a salted hash, never the raw IP: it can still be counted, but not traced back.

import { createHash } from "node:crypto";

// On Vercel the first address in x-forwarded-for is the real client. Locally there is none.
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || null;
}

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
