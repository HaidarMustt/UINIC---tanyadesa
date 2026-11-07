"use client";

import { useActionState } from "react";
import { trackAspirationAction, type TrackFormState } from "../track-actions";

const INITIAL_STATE: TrackFormState = { error: null, input: "" };

// Lets a resident reopen their aspiration with the tracking code, even if they lost the link.
export function TrackForm({ slug }: { slug: string }) {
  const [state, formAction, isPending] = useActionState(trackAspirationAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl bg-surface p-5" aria-labelledby="track-heading">
      <input type="hidden" name="slug" value={slug} />
      <div className="space-y-1">
        <h2 id="track-heading" className="font-bold">
          Sudah pernah mengirim?
        </h2>
        <p className="text-sm text-muted">Masukkan kode lacak untuk melihat status dan tanggapan desa.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="track-code" className="sr-only">
          Kode lacak
        </label>
        <input
          id="track-code"
          name="code"
          required
          maxLength={200}
          defaultValue={state.input}
          placeholder="Contoh: k7m2pq9x"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "track-error" : undefined}
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 font-bold tracking-wide"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-full bg-stamp px-6 py-3 font-extrabold text-surface disabled:opacity-60"
        >
          {isPending ? "Mencari…" : "Cek status"}
        </button>
      </div>

      {state.error && (
        <p id="track-error" role="alert" className="rounded-xl bg-kunyit-soft px-4 py-3 text-sm text-kunyit-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}
