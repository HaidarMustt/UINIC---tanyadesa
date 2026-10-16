// Cloudflare Turnstile: a CAPTCHA that usually stays invisible for real people
// but stops scripts that flood the aspiration form.
// The browser gets a one-time token; the server asks Cloudflare whether it is genuine.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5_000;

// Turned on only when both keys are set, so local development works without them.
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

// Cloudflare answers { success: boolean, "error-codes": string[], ... }.
export function isSuccessfulVerification(body: unknown): boolean {
  return typeof body === "object" && body !== null && (body as { success?: unknown }).success === true;
}

// Fails closed: no token, a network problem or a timeout all count as "not verified".
export async function verifyTurnstileToken(token: string | null, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return isSuccessfulVerification(await response.json());
  } catch (error) {
    console.error("[turnstile] verification request failed", error);
    return false;
  }
}
