// Health check: is the app up, and can it reach the database?
// Used by Vercel Cron once a day, which also keeps the free Supabase project from pausing.

import { db } from "./db";
import { buildHealthReport, type HealthReport } from "./health-report";

export async function checkHealth(): Promise<HealthReport> {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return buildHealthReport(true, Date.now() - startedAt, new Date());
  } catch (error) {
    // Details go to the server log only; the public answer stays short.
    console.error("[health] database unreachable", error);
    return buildHealthReport(false, null, new Date());
  }
}
