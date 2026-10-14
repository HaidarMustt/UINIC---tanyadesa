import type { ActivityStatus, FundSource } from "./types";

export const SECTOR_NAMES: Record<number, string> = {
  1: "Penyelenggaraan Pemerintahan Desa",
  2: "Pelaksanaan Pembangunan Desa",
  3: "Pembinaan Kemasyarakatan Desa",
  4: "Pemberdayaan Masyarakat Desa",
  5: "Penanggulangan Bencana, Keadaan Darurat dan Mendesak",
};

export const FUND_SOURCE_NAMES: Record<FundSource, string> = {
  DD: "Dana Desa",
  ADD: "Alokasi Dana Desa",
  PADES: "Pendapatan Asli Desa",
  BHP: "Bagi Hasil Pajak dan Retribusi",
  BANKEU_KAB: "Bantuan Keuangan Kabupaten",
  BANKEU_PROV: "Bantuan Keuangan Provinsi",
  SILPA: "Sisa Lebih Perhitungan Anggaran",
  OTHER: "Lainnya",
};

export const STATUS_NAMES: Record<ActivityStatus, string> = {
  NOT_STARTED: "belum dimulai",
  IN_PROGRESS: "sedang berjalan",
  COMPLETED: "sudah selesai",
  PARTIALLY_RECEIVED: "diterima sebagian",
  RECEIVED: "sudah diterima",
};
