// Audit trail: who did what, when. Used for logins, uploads, publishing, and later aspirations.

import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

export interface ActivityInput {
  userId: string;
  action: string; // e.g. "UPLOAD_DOCUMENT"
  entity: string; // e.g. "ApbdesDocument"
  entityId: string;
  details?: Prisma.InputJsonValue;
}

export function logActivity(input: ActivityInput) {
  return db.activityLog.create({ data: input });
}

export function findLatestActivity(entity: string, entityId: string, action: string) {
  return db.activityLog.findFirst({
    where: { entity, entityId, action },
    orderBy: { createdAt: "desc" },
  });
}
