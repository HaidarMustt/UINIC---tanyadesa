import { checkHealth } from "@/lib/health";

// GET /api/health
// 200 when everything works, 503 when the database cannot be reached.
// Never cached: a health check must always look at the live state.
export async function GET() {
  const report = await checkHealth();
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
