"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "../actions";

const INITIAL_STATE: LoginFormState = { error: null, email: "" };

export function LoginForm() {
  // useActionState runs the server action and gives back its result and a pending flag.
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Masuk</h1>

      <div className="space-y-1.5">
        <label htmlFor="email" className="font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="font-bold">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-line bg-surface px-4 py-3"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-kunyit-soft px-4 py-3 text-sm text-kunyit-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-stamp py-3.5 text-lg font-extrabold text-surface disabled:opacity-60"
      >
        {isPending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
