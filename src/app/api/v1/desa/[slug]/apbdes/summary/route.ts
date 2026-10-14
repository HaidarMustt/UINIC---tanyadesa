import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { getPublishedSummary } from "@/features/apbdes/server/apbdes.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { openDataJson, withErrorHandling } from "@/lib/http";

type Context = { params: Promise<{ slug: string }> };

// GET /api/v1/desa/sukamaju/apbdes/summary
export const GET = withErrorHandling(async (_request: Request, { params }: Context) => {
  const { slug } = await params;

  const parsed = DesaSlugSchema.safeParse(slug);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const summary = await getPublishedSummary(parsed.data);
  if (!summary) throw new NotFoundError("APBDes untuk desa ini belum tersedia.");

  return openDataJson(summary);
});
