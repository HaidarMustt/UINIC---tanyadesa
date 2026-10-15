// Aspirations are rarer than questions, so the limits are lower. They stop spam floods.

export const ASPIRATIONS_PER_SESSION_PER_HOUR = 5;
export const ASPIRATIONS_PER_DESA_PER_DAY = 200;

export type LimitResult = { allowed: true } | { allowed: false; message: string };

export function checkAspirationLimits(sessionCountLastHour: number, desaCountToday: number): LimitResult {
  if (sessionCountLastHour >= ASPIRATIONS_PER_SESSION_PER_HOUR) {
    return { allowed: false, message: "Kamu sudah mengirim beberapa aspirasi dalam satu jam terakhir. Coba lagi nanti." };
  }
  if (desaCountToday >= ASPIRATIONS_PER_DESA_PER_DAY) {
    return { allowed: false, message: "Batas aspirasi harian desa ini sudah tercapai. Coba lagi besok." };
  }
  return { allowed: true };
}
