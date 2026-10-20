// The test questions from the "Pertanyaan Uji" sheet, with expected results.
// Used by the unit test (with a fake AI) and by scripts/eval-qa.ts (with the real AI).

import type { Intent } from "@/features/qa/lib/intent";

export const SUKAMAJU_CONTEXT = {
  desaName: "Desa Sukamaju (Simulasi)",
  fiscalYear: 2026,
  dusuns: ["Krajan", "Karangrejo", "Ngemplak", "Tegalsari"],
};

export function makeIntent(partial: Partial<Intent>): Intent {
  return {
    type: "TOTAL",
    topic: null,
    infoCategory: null,
    entryType: null,
    sectorCode: null,
    dusun: null,
    rt: null,
    fundSource: null,
    status: null,
    keywords: [],
    measure: "BUDGET",
    asksPersonalData: false,
    ...partial,
  };
}

export interface QaTestCase {
  question: string;
  expectedStatus: "ANSWERED" | "NOT_FOUND" | "REFUSED";
  expectedCodes: string[];
  expectedText?: string;
  fakeIntent: Intent; // what a correct AI should return
}

export const QA_TEST_CASES: QaTestCase[] = [
  {
    question: "Berapa total Dana Desa tahun 2026?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["4.2.1"],
    expectedText: "Rp939.000.000",
    fakeIntent: makeIntent({ entryType: "REVENUE", fundSource: "DD" }),
  },
  {
    question: "Dana buat jalan RT 3 berapa?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["2.1.01"],
    expectedText: "Rp185.000.000",
    fakeIntent: makeIntent({ rt: "3", keywords: ["jalan", "aspal"] }),
  },
  {
    question: "Berapa persen belanja untuk pembangunan?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["2.1.01", "2.1.02", "2.1.03", "2.1.04", "2.1.05", "2.1.06", "2.1.07", "2.2.01", "2.2.02", "2.2.03", "2.3.01"],
    expectedText: "53,0%",
    fakeIntent: makeIntent({ type: "PERCENTAGE", entryType: "EXPENDITURE", sectorCode: 2 }),
  },
  {
    question: "Ada anggaran buat cegah stunting nggak?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["2.2.02"],
    expectedText: "Rp48.000.000",
    fakeIntent: makeIntent({ keywords: ["stunting", "gizi"] }),
  },
  {
    question: "Irigasi di Tegalsari sudah jadi belum?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["2.1.05"],
    expectedText: "sudah selesai",
    fakeIntent: makeIntent({ type: "STATUS", dusun: "Tegalsari", keywords: ["irigasi"] }),
  },
  {
    question: "Total belanja untuk Dusun Ngemplak berapa?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["2.1.04", "2.1.07", "5.2.02"],
    expectedText: "Rp144.000.000",
    fakeIntent: makeIntent({ entryType: "EXPENDITURE", dusun: "Ngemplak" }),
  },
  {
    question: "Siapa saja yang dapat BLT dan berapa per bulan?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["5.1.01"],
    expectedText: "tidak ditampilkan",
    fakeIntent: makeIntent({ keywords: ["blt", "bantuan langsung tunai"], asksPersonalData: true }),
  },
  {
    question: "Ada anggaran buat lapangan sepak bola?",
    expectedStatus: "NOT_FOUND",
    expectedCodes: [],
    fakeIntent: makeIntent({ keywords: ["lapangan", "sepak bola"] }),
  },
  {
    question: "Berapa modal desa yang dimasukkan ke BUMDes?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["6.2.2"],
    expectedText: "Rp40.000.000",
    fakeIntent: makeIntent({ entryType: "FINANCING_EXPENDITURE", keywords: ["bumdes"] }),
  },
  {
    question: "Kegiatan apa saja yang belum dimulai?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["2.1.03", "2.1.06", "4.1.01", "6.2.2"],
    expectedText: "Ada 4 kegiatan",
    fakeIntent: makeIntent({ type: "LIST", status: "NOT_STARTED" }),
  },

  // ---- Added after testing on the real page (15 Oct 2026): questions residents actually asked.
  {
    question: "apa itu apbdes",
    expectedStatus: "ANSWERED",
    expectedCodes: [],
    expectedText: "Anggaran Pendapatan dan Belanja Desa",
    fakeIntent: makeIntent({ type: "EXPLAIN", topic: "APBDES" }),
  },
  {
    question: "apakah rt dikasih dana dari desa?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["1.2.01", "2.1.01", "2.1.02", "2.1.03", "2.1.04", "2.1.05", "2.1.06", "2.1.07"],
    expectedText: "tidak membagi uang per RT",
    fakeIntent: makeIntent({ type: "EXPLAIN", topic: "DANA_PER_RT" }),
  },
  {
    question: "Dana Desa itu sebenarnya uang dari mana sih?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["4.2.1"],
    expectedText: "Rp939.000.000",
    fakeIntent: makeIntent({ type: "EXPLAIN", topic: "DANA_DESA" }),
  },
  {
    // Was REFUSED before Info desa existed (20 Oct 2026); now answered from the officers' entries.
    question: "Kapan jadwal posyandu bulan ini?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["Info desa", "Info desa"], // both posyandu schedules
    expectedText: "Posyandu Dusun Krajan",
    fakeIntent: makeIntent({ type: "INFO", infoCategory: "SCHEDULE", keywords: ["posyandu"] }),
  },
  {
    question: "Bedanya anggaran sama realisasi apa?",
    expectedStatus: "ANSWERED",
    expectedCodes: [],
    expectedText: "Realisasi adalah",
    fakeIntent: makeIntent({ type: "EXPLAIN", topic: "REALISASI" }),
  },

  // ---- Info desa (added 20 Oct 2026)
  {
    question: "Syarat bikin surat pengantar KTP apa aja?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["Info desa"],
    expectedText: "fotokopi Kartu Keluarga",
    fakeIntent: makeIntent({ type: "INFO", infoCategory: "SERVICE", keywords: ["ktp", "pengantar"] }),
  },
  {
    question: "Kantor desa buka jam berapa?",
    expectedStatus: "ANSWERED",
    expectedCodes: ["Info desa"],
    expectedText: "Senin sampai Jumat",
    fakeIntent: makeIntent({ type: "INFO", infoCategory: "SCHEDULE", keywords: ["kantor", "jam"] }),
  },
  {
    question: "Besok hujan nggak ya?",
    expectedStatus: "REFUSED",
    expectedCodes: [],
    expectedText: "hubungi kantor desa",
    fakeIntent: makeIntent({ type: "OFF_TOPIC" }),
  },
];
