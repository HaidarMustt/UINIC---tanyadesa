// The shape of a health check answer. Pure, so it can be unit-tested without a database.

export interface HealthReport {
  status: "ok" | "degraded";
  database: "ok" | "unreachable";
  databaseLatencyMs: number | null;
  checkedAt: string;
}

export function buildHealthReport(databaseOk: boolean, latencyMs: number | null, now: Date): HealthReport {
  return {
    status: databaseOk ? "ok" : "degraded",
    database: databaseOk ? "ok" : "unreachable",
    databaseLatencyMs: databaseOk ? latencyMs : null,
    checkedAt: now.toISOString(),
  };
}
