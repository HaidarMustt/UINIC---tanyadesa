"use server";

// Server Actions: functions the login form calls directly. They run on the server,
// so they can read the database and set the cookie.

import { redirect } from "next/navigation";
import { LoginSchema } from "./schemas";
import { createSession, destroySession } from "./server/auth-session";
import { login } from "./server/auth.service";

export interface LoginFormState {
  error: string | null;
  email: string;
}

export async function loginAction(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = LoginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.message, email };

  await createSession(result.userId);
  redirect("/panel");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/masuk");
}
