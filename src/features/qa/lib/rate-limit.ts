// Limits protect the free AI quota and keep the service fair for every resident.

export const QUESTIONS_PER_SESSION_PER_HOUR = 20;
export const QUESTIONS_PER_DESA_PER_DAY = 500;

export type LimitResult = { allowed: true } | { allowed: false; message: string };

export function checkQuestionLimits(sessionCountLastHour: number, desaCountToday: number): LimitResult {
  if (sessionCountLastHour >= QUESTIONS_PER_SESSION_PER_HOUR) {
    return {
      allowed: false,
      message: "Kamu sudah bertanya cukup banyak dalam satu jam terakhir. Coba lagi nanti ya.",
    };
  }
  if (desaCountToday >= QUESTIONS_PER_DESA_PER_DAY) {
    return {
      allowed: false,
      message: "Batas pertanyaan harian untuk desa ini sudah tercapai. Coba lagi besok.",
    };
  }
  return { allowed: true };
}
