import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { AskQuestionSchema } from "@/features/qa/schemas";
import { askQuestion } from "@/features/qa/server/qa.service";
import { ValidationError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/http";
import { getOrCreateSessionId } from "@/lib/session";

type Context = { params: Promise<{ slug: string }> };

// POST /api/v1/desa/sukamaju/questions
// body: { "question": "Kalau di Krajan?", "previousQuestion": "Dana jalan RT 3 berapa?" }  (previousQuestion optional)
export const POST = withErrorHandling(async (request: Request, { params }: Context) => {
  const { slug } = await params;

  const parsedSlug = DesaSlugSchema.safeParse(slug);
  if (!parsedSlug.success) throw new ValidationError(parsedSlug.error.issues[0].message);

  const body = await request.json().catch(() => null);
  const parsedBody = AskQuestionSchema.safeParse(body);
  if (!parsedBody.success) throw new ValidationError(parsedBody.error.issues[0].message);

  const { sessionId, setCookie } = getOrCreateSessionId(request);
  const result = await askQuestion(parsedSlug.data, parsedBody.data.question, sessionId, parsedBody.data.previousQuestion);

  const response = Response.json(result);
  if (setCookie) response.headers.set("Set-Cookie", setCookie);
  return response;
});
