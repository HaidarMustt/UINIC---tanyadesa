// The answer shape returned by POST /api/v1/desa/{slug}/questions.
// Lives in its own file so both the server and the browser can import it.

export interface AnswerSource {
  accountCode: string;
  description: string;
}

export interface QuestionAnswer {
  id: string;
  status: "ANSWERED" | "NOT_FOUND" | "REFUSED";
  answer: string;
  sources: AnswerSource[];
  isSimulation: boolean;
}
