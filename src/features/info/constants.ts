// Village information that is not in the APBDes: schedules, service requirements,
// announcements and office contacts. Written by village officers, never by the AI.

export const INFO_CATEGORIES = ["SCHEDULE", "SERVICE", "ANNOUNCEMENT", "CONTACT"] as const;
export type InfoCategory = (typeof INFO_CATEGORIES)[number];

export const INFO_CATEGORY_LABELS: Record<InfoCategory, string> = {
  SCHEDULE: "Jadwal layanan",
  SERVICE: "Syarat layanan",
  ANNOUNCEMENT: "Pengumuman",
  CONTACT: "Kontak kantor desa",
};

export const MAX_INFO_TITLE_LENGTH = 120;
export const MAX_INFO_CONTENT_LENGTH = 1000;
