// Reads and writes the login cookie, and guards pages and actions.
// Every page AND every server action in the panel must call requireUser/requireRole:
// hiding a button is not security, checking on the server is.

import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { SESSION_DURATION_SECONDS, signSessionToken, verifySessionToken } from "../lib/session-token";
import { findActiveUserById } from "./auth.repository";

const COOKIE_NAME = "td_session";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET belum diisi di .env");
  return secret;
}

export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken({ userId }, getSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser cannot read it
    secure: process.env.NODE_ENV === "production", // HTTPS only once deployed
    sameSite: "lax", // not sent on cross-site form posts
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof findActiveUserById>>>;

// The logged-in user, or null. Checks the database too, so a deactivated
// account is logged out immediately even if its token has not expired.
// cache(): the layout and the page both ask for the user; within one request
// the database is only queried once.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token, getSecret());
  if (!payload) return null;

  return findActiveUserById(payload.userId);
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/panel?akses=ditolak");
  return user;
}
