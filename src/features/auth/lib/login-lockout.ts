// Slows down password guessing: after too many wrong passwords,
// the account is locked for a while. Failures are counted from the activity log,
// so no extra database column is needed.

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

// Count failures from whichever is later: the start of the lockout window,
// or the last successful login (a correct password resets the counter).
export function failureWindowStart(now: Date, lastLoginAt: Date | null): Date {
  const windowStart = new Date(now.getTime() - LOCKOUT_MINUTES * 60 * 1000);
  return lastLoginAt && lastLoginAt > windowStart ? lastLoginAt : windowStart;
}

export function isLockedOut(recentFailures: number): boolean {
  return recentFailures >= MAX_FAILED_LOGINS;
}
