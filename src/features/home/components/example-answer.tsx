import { AnswerCard } from "@/features/qa/components/answer-card";
import type { WelcomeExample } from "../lib/pick-example";

// A real question and answer, so visitors see how TanyaDesa works before they type.
export function ExampleAnswer({ example }: { example: WelcomeExample }) {
  return (
    <figure className="m-0 space-y-3">
      <figcaption className="text-sm font-semibold text-muted">Contoh tanya jawab</figcaption>
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-stamp px-4 py-2.5 font-semibold text-surface">
        {example.question}
      </p>
      <AnswerCard
        result={{
          id: "contoh",
          status: example.answer.status,
          kind: example.answer.kind,
          suggestions: [],
          answer: example.answer.text,
          sources: example.answer.sources,
          isSimulation: false,
        }}
      />
    </figure>
  );
}
