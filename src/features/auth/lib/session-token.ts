// Signs and verifies the login token stored in the session cookie.
// The token is signed (HS256), so a user cannot edit it to become someone else.
// It is NOT encrypted, so it only carries ids, never secrets.

import { jwtVerify, SignJWT } from "jose";

export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // one working day

export interface SessionPayload {
  userId: string;
}

function toKey(secret: string): Uint8Array {
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET minimal 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(toKey(secret));
}

// Returns null for anything wrong: bad signature, expired, malformed.
export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, toKey(secret), { algorithms: ["HS256"] });
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}
