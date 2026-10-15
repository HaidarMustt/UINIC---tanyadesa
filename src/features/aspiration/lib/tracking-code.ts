// The tracking code is the resident's only key to an anonymous aspiration, so it must be
// hard to guess: 8 characters from 32 symbols = about 1 trillion combinations.
// Letters that look alike (0/o, 1/l/i) are left out, so it is easy to copy by hand.

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // 31 symbols
export const TRACKING_CODE_LENGTH = 8;

export function generateTrackingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TRACKING_CODE_LENGTH));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
