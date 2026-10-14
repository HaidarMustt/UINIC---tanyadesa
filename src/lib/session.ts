// Anonymous session id for residents (no login needed).
// Stored in an httpOnly cookie, used only to limit how many questions one browser can ask.

const COOKIE_NAME = "td_sid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// Returns the existing session id, or a new one plus the cookie to set.
export function getOrCreateSessionId(request: Request): { sessionId: string; setCookie: string | null } {
  const existing = readCookie(request, COOKIE_NAME);
  if (existing && UUID_PATTERN.test(existing)) return { sessionId: existing, setCookie: null };

  const sessionId = crypto.randomUUID();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const setCookie = `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ONE_YEAR_SECONDS}${secure}`;
  return { sessionId, setCookie };
}
