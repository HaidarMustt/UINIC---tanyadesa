// The tracking code is the resident's only key to an anonymous aspiration, so it must be
// hard to guess: 8 characters from 32 symbols = about 1 trillion combinations.
// Letters that look alike (0/o, 1/l/i) are left out, so it is easy to copy by hand.

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // 31 symbols
export const TRACKING_CODE_LENGTH = 8;

export function generateTrackingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TRACKING_CODE_LENGTH));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${TRACKING_CODE_LENGTH}}$`);

/**
 * Turns what a resident types into a tracking code, or null if it cannot be one.
 * Accepts upper case, spaces or dashes ("K7M2 PQ9X", "k7m2-pq9x") and a pasted tracking link
 * (".../aspirasi/k7m2pq9x?baru=1"), because residents copy the code in many ways.
 */
export function normalizeTrackingCode(input: string): string | null {
  let text = input.trim().toLowerCase();
  const fromLink = text.match(/\/aspirasi\/([^/?#\s]+)/);
  if (fromLink) text = fromLink[1];
  text = text.replace(/[\s-]/g, "");
  return CODE_PATTERN.test(text) ? text : null;
}
