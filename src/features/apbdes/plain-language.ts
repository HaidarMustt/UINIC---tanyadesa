// Everyday names for the official terms, written by people for residents.
// The official names stay in constants.ts and in the API.

import type { FundSource } from "./types";

export const SECTOR_PLAIN: Record<number, { name: string; examples: string }> = {
  1: { name: "Pemerintahan desa", examples: "gaji perangkat, kantor desa, BPD" },
  2: { name: "Pembangunan", examples: "jalan, saluran air, posyandu, PAUD" },
  3: { name: "Kemasyarakatan", examples: "keamanan, keagamaan, PKK" },
  4: { name: "Pemberdayaan warga", examples: "pelatihan, kelompok tani, UMKM" },
  5: { name: "Bantuan dan keadaan mendesak", examples: "BLT Dana Desa, cadangan bencana" },
};

export const FUND_SOURCE_PLAIN: Record<FundSource, string> = {
  DD: "Dana Desa, kiriman pemerintah pusat",
  ADD: "Alokasi Dana Desa dari kabupaten",
  PADES: "pendapatan desa sendiri",
  BHP: "bagi hasil pajak dari kabupaten",
  BANKEU_KAB: "bantuan keuangan kabupaten",
  BANKEU_PROV: "bantuan keuangan provinsi",
  SILPA: "sisa anggaran tahun lalu",
  OTHER: "sumber lain",
};
