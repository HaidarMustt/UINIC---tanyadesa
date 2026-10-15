import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { SubmitAspirationSchema } from "@/features/aspiration/schemas";
import { submitAspiration } from "@/features/aspiration/server/aspiration.service";
import { ValidationError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/http";
import { getOrCreateSessionId } from "@/lib/session";

type Context = { params: Promise<{ slug: string }> };

// POST /api/v1/desa/sukamaju/aspirations
// body: { "content": "...", "dusun": "Tegalsari", "rt": "11", "senderName": null, "contact": null }
// Answers with the tracking code only. Nothing the resident sent is echoed back.
export const POST = withErrorHandling(async (request: Request, { params }: Context) => {
  const { slug } = await params;

  const parsedSlug = DesaSlugSchema.safeParse(slug);
  if (!parsedSlug.success) throw new ValidationError(parsedSlug.error.issues[0].message);

  const body = await request.json().catch(() => null);
  const parsedBody = SubmitAspirationSchema.safeParse(body);
  if (!parsedBody.success) throw new ValidationError(parsedBody.error.issues[0].message);

  const { sessionId, setCookie } = getOrCreateSessionId(request);
  const saved = await submitAspiration(parsedSlug.data, parsedBody.data, sessionId);

  const response = Response.json({ trackingCode: saved.trackingCode, status: saved.status }, { status: 201 });
  if (setCookie) response.headers.set("Set-Cookie", setCookie);
  return response;
});
