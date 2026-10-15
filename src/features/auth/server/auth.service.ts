// Login flow: find the user, check the lockout, check the password, record the attempt.

import bcrypt from "bcryptjs";
import { failureWindowStart, isLockedOut, LOCKOUT_MINUTES } from "../lib/login-lockout";
import {
  countFailedLoginsSince,
  findUserByEmail,
  logLoginAttempt,
  markLoggedIn,
} from "./auth.repository";

// Compared against when the email does not exist, so a wrong email takes as long
// as a wrong password. Otherwise an attacker could time the response to find real emails.
const DUMMY_HASH = "$2b$10$7l/mt0QGezGeABkGUvxNuO1Wl/0Nh.iRtiPU1c/5157aRCU15sXEa";

// One message for every failure, so it never reveals which part was wrong.
const WRONG_CREDENTIALS = "Email atau kata sandi salah.";

export type LoginResult = { ok: true; userId: string } | { ok: false; message: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(email);

  if (!user || !user.isActive) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, message: WRONG_CREDENTIALS };
  }

  const failures = await countFailedLoginsSince(user.id, failureWindowStart(new Date(), user.lastLoginAt));
  if (isLockedOut(failures)) {
    return {
      ok: false,
      message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${LOCKOUT_MINUTES} menit.`,
    };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  await logLoginAttempt(user.id, passwordMatches);
  if (!passwordMatches) return { ok: false, message: WRONG_CREDENTIALS };

  await markLoggedIn(user.id);
  return { ok: true, userId: user.id };
}
