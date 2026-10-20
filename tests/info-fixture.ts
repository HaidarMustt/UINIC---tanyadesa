// Info desa used by tests and the AI evaluation, the same entries as prisma/seed.ts.

import type { InfoEntry } from "@/features/info/types";

const updatedAt = new Date("2026-10-20T08:00:00+07:00");

export const SUKAMAJU_INFOS: InfoEntry[] = [
  { category: "SCHEDULE", title: "Jam layanan kantor desa", content: "Senin sampai Jumat pukul 08.00–14.00, Sabtu pukul 08.00–12.00. Minggu dan hari libur nasional tutup.", dusun: null, validUntil: null, updatedAt },
  { category: "SCHEDULE", title: "Posyandu Dusun Krajan", content: "Setiap tanggal 10, pukul 08.00–11.00 di Balai Dusun Krajan. Bawa buku KIA. Ada penimbangan balita dan pemberian makanan tambahan.", dusun: "Krajan", validUntil: null, updatedAt },
  { category: "SCHEDULE", title: "Posyandu Dusun Tegalsari", content: "Setiap tanggal 15, pukul 08.00–11.00 di rumah Ketua RT 11. Bawa buku KIA.", dusun: "Tegalsari", validUntil: null, updatedAt },
  { category: "SERVICE", title: "Surat pengantar KTP", content: "Bawa fotokopi Kartu Keluarga dan surat pengantar dari RT. Diurus di kantor desa, biasanya selesai di hari yang sama. Tidak dipungut biaya.", dusun: null, validUntil: null, updatedAt },
  { category: "SERVICE", title: "Surat keterangan tidak mampu (SKTM)", content: "Bawa Kartu Keluarga, KTP, dan surat pengantar dari RT. Ditandatangani kepala desa, biasanya 1–2 hari kerja. Tidak dipungut biaya.", dusun: null, validUntil: null, updatedAt },
  { category: "ANNOUNCEMENT", title: "Kerja bakti bersih saluran", content: "Minggu, 1 November 2026, pukul 07.00. Kumpul di Balai Desa, bawa cangkul atau sapu lidi. Fokus di saluran Dusun Ngemplak dan Karangrejo.", dusun: null, validUntil: new Date("2026-11-01T00:00:00+07:00"), updatedAt },
  { category: "CONTACT", title: "Kantor Desa Sukamaju", content: "Telepon kantor (0000) 123-456 (nomor simulasi). Untuk surat-menyurat temui Kaur Umum; untuk pembangunan temui Kaur Perencanaan.", dusun: null, validUntil: null, updatedAt },
];
