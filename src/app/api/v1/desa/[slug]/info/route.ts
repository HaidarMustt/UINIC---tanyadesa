import { z } from "zod";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { INFO_CATEGORIES } from "@/features/info/constants";
import { getPublicInfos } from "@/features/info/server/info.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/http";

type Context = { params: Promise<{ slug: string }> };

const QuerySchema = z.object({ category: z.enum(INFO_CATEGORIES).optional() });

// GET /api/v1/desa/sukamaju/info?category=SCHEDULE
// Schedules, service requirements, announcements and office contacts, as open data.
// Cached for a shorter time than the APBDes, because officers update it more often.
export const GET = withErrorHandling(async (request: Request, { params }: Context) => {
  const { slug } = await params;
  const parsedSlug = DesaSlugSchema.safeParse(slug);
  if (!parsedSlug.success) throw new ValidationError(parsedSlug.error.issues[0].message);

  const query = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) throw new ValidationError(`Parameter "category" harus salah satu dari: ${INFO_CATEGORIES.join(", ")}.`);

  const result = await getPublicInfos(parsedSlug.data, query.data.category ?? null);
  if (!result) throw new NotFoundError("Desa tidak ditemukan.");

  return Response.json(result, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    },
  });
});
