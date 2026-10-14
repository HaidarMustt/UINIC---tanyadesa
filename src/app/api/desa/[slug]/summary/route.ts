import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { getPublishedSummary } from "@/features/apbdes/server/apbdes.service";

// GET /api/desa/sukamaju/summary
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const parsed = DesaSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const summary = await getPublishedSummary(parsed.data);
  if (!summary) {
    return Response.json({ error: "APBDes untuk desa ini belum tersedia." }, { status: 404 });
  }

  return Response.json(summary);
}