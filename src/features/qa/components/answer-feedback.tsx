"use client";

// "Apakah jawaban ini membantu?" under each answer. The rating is saved anonymously
// and shown to officers, so the desa learns which answers need better data.

import { useState } from "react";

type State = "idle" | "sending" | "saved" | "failed";

export function AnswerFeedback({ slug, questionId }: { slug: string; questionId: string }) {
  const [state, setState] = useState<State>("idle");
  const [choice, setChoice] = useState<boolean | null>(null);

  async function rate(helpful: boolean) {
    setChoice(helpful);
    setState("sending");
    try {
      const response = await fetch(`/api/v1/desa/${slug}/questions/${questionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });
      setState(response.ok ? "saved" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "saved") {
    return (
      <p role="status" className="text-sm text-muted">
        Terima kasih atas penilaiannya.
      </p>
    );
  }

  const buttonClass = (value: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold disabled:opacity-50 ${
      choice === value ? "border-stamp bg-stamp/10 text-stamp" : "border-line bg-surface hover:border-stamp"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Penilaian jawaban">
      <span className="text-sm text-muted">Apakah jawaban ini membantu?</span>
      <button type="button" disabled={state === "sending"} aria-pressed={choice === true} onClick={() => rate(true)} className={buttonClass(true)}>
        <ThumbIcon /> Ya
      </button>
      <button type="button" disabled={state === "sending"} aria-pressed={choice === false} onClick={() => rate(false)} className={buttonClass(false)}>
        <ThumbIcon down /> Kurang
      </button>
      {state === "failed" && (
        <span role="alert" className="text-sm text-kunyit-ink">
          Gagal menyimpan. Coba lagi.
        </span>
      )}
    </div>
  );
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={down ? "rotate-180" : undefined}>
      <path d="M7 10v11H4V10zM7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" />
    </svg>
  );
}
