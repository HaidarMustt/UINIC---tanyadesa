import type { QuestionAnswer } from "../types";

interface AnswerCardProps {
  result: QuestionAnswer;
}

// A short label on top tells the resident what kind of answer this is.
const STATUS_LABEL: Record<QuestionAnswer["status"], { text: string; className: string }> = {
  ANSWERED: { text: "Terjawab dari APBDes", className: "bg-stamp/10 text-stamp" },
  NOT_FOUND: { text: "Tidak ada di APBDes", className: "bg-line text-muted" },
  // REFUSED covers several reasons (personal data, off-topic, unclear), so the label stays neutral.
  REFUSED: { text: "Tidak bisa dijawab", className: "bg-kunyit-soft text-kunyit-ink" },
};

// One answer, with the account codes it came from. The codes are the "receipt":
// a resident can find the same rows in the APBDes document and check the numbers.
export function AnswerCard({ result }: AnswerCardProps) {
  const label = STATUS_LABEL[result.status];

  return (
    <div className="space-y-3 rounded-2xl bg-surface p-4 sm:p-5">
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold ${label.className}`}>
        {label.text}
      </span>
      {/* pre-line keeps the line breaks of list answers ("1. ...\n2. ...") */}
      <p className="leading-relaxed whitespace-pre-line">{result.answer}</p>

      {result.sources.length > 0 && (
        <div className="border-t border-dashed border-line pt-3">
          <p className="text-sm font-semibold text-muted">
            Sumber di APBDes ({result.sources.length} baris)
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.sources.map((source) => (
              <li key={source.accountCode} className="flex gap-3 text-sm">
                <span className="shrink-0 rounded-md bg-stamp/10 px-2 py-0.5 font-bold text-stamp">
                  {source.accountCode}
                </span>
                <span className="text-muted">{source.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
