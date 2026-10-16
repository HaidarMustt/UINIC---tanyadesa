// Aspirations are rarer than questions, so the limits are lower. They stop spam floods.

export const ASPIRATIONS_PER_SESSION_PER_HOUR = 5;
export const ASPIRATIONS_PER_DESA_PER_DAY = 200;
// Higher than per browser: a whole family, a mosque or a campus can share one IP address.
export const ASPIRATIONS_PER_IP_PER_HOUR = 15;

export type LimitResult = { allowed: true } | { allowed: false; message: string };

export interface AspirationCounts {
  sessionLastHour: number;
  ipLastHour: number;
  desaToday: number;
}

export function checkAspirationLimits(counts: AspirationCounts): LimitResult {
  if (counts.sessionLastHour >= ASPIRATIONS_PER_SESSION_PER_HOUR || counts.ipLastHour >= ASPIRATIONS_PER_IP_PER_HOUR) {
    return { allowed: false, message: "Kamu sudah mengirim beberapa aspirasi dalam satu jam terakhir. Coba lagi nanti." };
  }
  if (counts.desaToday >= ASPIRATIONS_PER_DESA_PER_DAY) {
    return { allowed: false, message: "Batas aspirasi harian desa ini sudah tercapai. Coba lagi besok." };
  }
  return { allowed: true };
}
