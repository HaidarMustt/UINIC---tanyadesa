"use client";

// The interactive part of the Tanya page. It runs in the browser because it needs
// state (the conversation) and events (typing, submitting).

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "../constants";
import type { QuestionTopic } from "../lib/topics";
import type { QuestionAnswer } from "../types";
import { AnswerCard } from "./answer-card";
import { AnswerFeedback } from "./answer-feedback";

type Turn =
  | { id: number; question: string; state: "loading" }
  | { id: number; question: string; state: "done"; result: QuestionAnswer }
  | { id: number; question: string; state: "error"; message: string };

interface AskPanelProps {
  slug: string;
  topics: QuestionTopic[];
}

// Calls our own API. Every failure becomes a sentence a resident can act on.
async function postQuestion(slug: string, question: string, previousQuestion: string | null): Promise<QuestionAnswer> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/desa/${slug}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, previousQuestion }),
    });
  } catch {
    throw new Error("Tidak bisa terhubung. Periksa koneksi internet, lalu coba lagi.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Terjadi kesalahan. Coba lagi beberapa saat lagi.");
  }
  return body as QuestionAnswer;
}

export function AskPanel({ slug, topics }: AskPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [topicId, setTopicId] = useState(topics[0]?.id);
  const topic = topics.find((item) => item.id === topicId) ?? topics[0];
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLoading = turns.some((turn) => turn.state === "loading");
  const trimmed = draft.trim();
  const canSubmit = !isLoading && trimmed.length >= MIN_QUESTION_LENGTH;

  // Keep the newest answer in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function submit(question: string) {
    const text = question.trim();
    if (isLoading || text.length < MIN_QUESTION_LENGTH) return;

    // The last answered question goes along, so "kalau di Krajan?" can be understood.
    const lastAnswered = [...turns].reverse().find((turn) => turn.state === "done");
    const previousQuestion = lastAnswered ? lastAnswered.question : null;

    const id = nextId.current++;
    setTurns((current) => [...current, { id, question: text, state: "loading" }]);
    setDraft("");

    try {
      const result = await postQuestion(slug, text, previousQuestion);
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { id, question: text, state: "done", result } : turn)),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { id, question: text, state: "error", message } : turn)),
      );
    } finally {
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(draft);
  }

  // Enter sends, Shift+Enter makes a new line (like WhatsApp on a laptop).
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(draft);
    }
  }

  return (
    <div className="space-y-6">
      {turns.length === 0 && (
        <section aria-labelledby="welcome-heading" className="space-y-6">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stamp text-surface">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
              </svg>
            </span>
            <div className="space-y-1 rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
              <h2 id="welcome-heading" className="font-bold">
                Halo! Mau tanya soal apa?
              </h2>
              <p className="text-sm text-muted">
                Aku bisa bantu cari anggaran dan kemajuan kegiatan di APBDes, juga jadwal, syarat layanan, dan pengumuman dari kantor desa.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-muted">Pilih topik</h3>
            <div role="group" aria-label="Topik pertanyaan" className="flex flex-wrap gap-2">
              {topics.map((item) => {
                const isSelected = item.id === topic?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setTopicId(item.id)}
                    className={
                      isSelected
                        ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper"
                        : "min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:border-stamp hover:text-stamp"
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {topic && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-muted">Ketuk salah satu untuk bertanya</h3>
              <ul className="space-y-2">
                {topic.questions.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => submit(example)}
                      className="min-h-12 w-full rounded-xl bg-stamp/10 px-4 py-2.5 text-left text-sm hover:bg-stamp/15"
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="rounded-xl bg-kunyit-soft px-4 py-3 text-sm text-kunyit-ink">
            Info layanan ditulis oleh perangkat desa. Kalau yang kamu cari belum ada, sampaikan lewat menu Aspirasi.
          </p>
        </section>
      )}

      {/* Screen readers announce each new answer without the user moving focus. */}
      <ol aria-live="polite" aria-busy={isLoading} className="space-y-6">
        {turns.map((turn) => (
          <li key={turn.id} className="space-y-3">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-stamp px-4 py-2.5 text-surface">
              <span className="sr-only">Pertanyaan: </span>
              {turn.question}
            </p>

            {turn.state === "loading" && (
              <p className="flex items-center gap-2 text-muted">
                <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-kunyit" />
                Mencari di APBDes…
              </p>
            )}
            {turn.state === "done" && <AnswerCard result={turn.result} />}
            {turn.state === "done" && <AnswerFeedback slug={slug} questionId={turn.result.id} />}
            {/* Next questions only under the newest answer, so older ones stay calm. */}
            {turn.state === "done" && turn.id === turns[turns.length - 1]?.id && turn.result.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted">Tanya lanjutan</p>
                <ul className="flex flex-wrap gap-2">
                  {turn.result.suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => submit(suggestion)}
                        className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm hover:border-stamp hover:text-stamp disabled:opacity-40"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {turn.state === "error" && (
              <p role="alert" className="rounded-2xl bg-kunyit-soft p-4 text-kunyit-ink">
                {turn.message}
              </p>
            )}
          </li>
        ))}
      </ol>
      {/* scroll-mb leaves room so the newest answer is not hidden behind the sticky form */}
      <div ref={bottomRef} className="scroll-mb-48" />

      {/* Frosted composer: answers scrolling underneath fade out and blur, so the form
          floats over the conversation instead of cutting it off. */}
      {/* Before the first question the form sits in the normal flow, so it never covers the
          topic buttons on a small phone. Once a conversation starts it sticks to the bottom. */}
      <div
        className={
          turns.length === 0
            ? "pt-2 pb-3"
            : "sticky bottom-0 bg-linear-to-t from-paper via-paper/70 to-transparent pt-8 pb-3"
        }
      >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-line/70 bg-surface/70 p-3 shadow-lg shadow-ink/10 backdrop-blur-md transition-colors focus-within:border-stamp/60 focus-within:bg-surface/90 focus-within:ring-4 focus-within:ring-stamp/15"
      >
        <label htmlFor="question" className="sr-only">
          Tulis pertanyaan tentang anggaran desa
        </label>
        <textarea
          id="question"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ketik pertanyaanmu di sini…"
          className="w-full resize-none bg-transparent px-2 py-1 outline-none placeholder:text-muted focus-visible:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="px-2 text-xs text-muted" aria-live="polite">
            {draft.length > MAX_QUESTION_LENGTH - 50
              ? `${MAX_QUESTION_LENGTH - draft.length} karakter lagi`
              : turns.length === 0
                ? "Ketik dengan bahasa sehari-hari, lalu tekan Tanya."
                : "Boleh menyambung pertanyaan sebelumnya, misalnya \u201Ckalau di Krajan?\u201D"}
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-stamp px-5 py-2 font-semibold text-surface disabled:opacity-40"
          >
            {isLoading ? "Menunggu…" : "Tanya"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
