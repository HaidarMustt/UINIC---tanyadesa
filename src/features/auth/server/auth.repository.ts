// Database access for login. Only Prisma queries live here.

import { db } from "@/lib/db";

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

// The logged-in user with the desa they belong to. Inactive users count as logged out.
export function findActiveUserById(id: string) {
  return db.user.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      desa: { select: { id: true, slug: true, name: true } },
    },
  });
}

export function countFailedLoginsSince(userId: string, since: Date) {
  return db.activityLog.count({
    where: { userId, action: "LOGIN_FAILED", createdAt: { gte: since } },
  });
}

export function logLoginAttempt(userId: string, success: boolean) {
  return db.activityLog.create({
    data: {
      userId,
      action: success ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
      entity: "User",
      entityId: userId,
    },
  });
}

export function markLoggedIn(userId: string) {
  return db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}
