import { FeedbackSchema, QuestionIdSchema } from "@/features/qa/schemas";
import { setQuestionFeedback } from "@/features/qa/server/qa.repository";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/http";
import { getOrCreateSessionId } from "@/lib/session";

type Context = { params: Promise<{ slug: string; id: string }> };

// POST /api/v1/desa/sukamaju/questions/{id}/feedback   body: { "helpful": true }
// "Apakah jawaban ini membantu?" Only the browser that asked may rate its answer.
export const POST = withErrorHandling(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const parsedId = QuestionIdSchema.safeParse(id);
  if (!parsedId.success) throw new ValidationError(parsedId.error.issues[0].message);

  const body = await request.json().catch(() => null);
  const parsedBody = FeedbackSchema.safeParse(body);
  if (!parsedBody.success) throw new ValidationError("Penilaian tidak valid.");

  const { sessionId } = getOrCreateSessionId(request);
  const saved = await setQuestionFeedback(parsedId.data, sessionId, parsedBody.data.helpful);
  if (!saved) throw new NotFoundError("Pertanyaan tidak ditemukan.");

  return Response.json({ ok: true });
});
