// "Intent" = a resident's question translated into structured filters.
// The AI ONLY fills in this object (language understanding). It never calculates anything.
// Every field is required and uses null for "not mentioned", because strict JSON mode
// on the AI side requires all fields to be present.

import { z } from "zod";
import { GLOSSARY_TOPICS } from "./glossary";

export const IntentSchema = z.object({
  type: z.enum(["TOTAL", "LIST", "PERCENTAGE", "STATUS", "EXPLAIN", "OFF_TOPIC"]),
  topic: z.enum(GLOSSARY_TOPICS).nullable(), // only for EXPLAIN
  entryType: z
    .enum(["REVENUE", "EXPENDITURE", "FINANCING_RECEIPT", "FINANCING_EXPENDITURE"])
    .nullable(),
  sectorCode: z.number().int().min(1).max(5).nullable(),
  dusun: z.string().nullable(),
  rt: z.string().nullable(),
  fundSource: z
    .enum(["DD", "ADD", "PADES", "BHP", "BANKEU_KAB", "BANKEU_PROV", "SILPA", "OTHER"])
    .nullable(),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PARTIALLY_RECEIVED", "RECEIVED"])
    .nullable(),
  keywords: z.array(z.string()).max(8),
  // Nullable: for EXPLAIN and OFF_TOPIC there is nothing to measure, and the model
  // writes null there. A required value made the provider reject the whole answer.
  measure: z.enum(["BUDGET", "REALIZED"]).nullable(), // null is read as BUDGET
  asksPersonalData: z.boolean(),
});

export type Intent = z.infer<typeof IntentSchema>;

export interface DesaContext {
  desaName: string;
  fiscalYear: number;
  dusuns: string[];
}

export function buildIntentPrompt(context: DesaContext): string {
  return `Kamu membantu warga ${context.desaName} memahami APBDes tahun ${context.fiscalYear}.
Ubah pertanyaan warga menjadi JSON sesuai skema. JANGAN menjawab pertanyaannya.

Aturan:
- type: TOTAL (berapa jumlahnya), LIST (apa saja), PERCENTAGE (berapa persen),
  STATUS (bagaimana kemajuan kegiatan tertentu), EXPLAIN (warga bertanya ARTI istilah atau
  CARA KERJA anggaran desa, bukan angka kegiatan tertentu), OFF_TOPIC (bukan tentang anggaran
  desa ini, misalnya jadwal, syarat layanan surat, alamat kantor, atau topik di luar desa).
- topic (hanya untuk EXPLAIN, selain itu null): APBDES (apa itu APBDes), DANA_DESA (apa itu
  Dana Desa / dari mana asalnya), ADD, PADES, SILPA, BIDANG (pembagian bidang belanja),
  REALISASI (beda anggaran dan realisasi), BLT_DD (apa itu BLT Dana Desa, siapa yang berhak),
  DANA_PER_RT (apakah tiap RT atau dusun mendapat jatah uang sendiri), USUL_KEGIATAN
  (bagaimana warga mengusulkan kegiatan), BUMDES (apa itu BUMDes). Istilah lain yang tidak
  ada di daftar ini: tetap EXPLAIN dengan topic null.
- Kata "dana desa" yang berarti "uang desa" secara umum BUKAN sumber dana Dana Desa.
- dusun: hanya salah satu dari: ${context.dusuns.join(", ")}. Selain itu null.
- rt: angka saja, contoh "RT 3" menjadi "3".
- entryType: isi HANYA kalau warga menyebut atau jelas memaksudkan jenisnya. Untuk
  "kegiatan apa saja ..." tanpa kata belanja/pendapatan/pembiayaan, biarkan null.
  REVENUE = pendapatan desa (Dana Desa yang diterima, ADD, hasil usaha, bantuan).
  EXPENDITURE = belanja kegiatan.
  FINANCING_RECEIPT = pembiayaan masuk, misalnya SiLPA (sisa anggaran tahun lalu).
  FINANCING_EXPENDITURE = pembiayaan keluar, misalnya penyertaan modal ke BUMDes.
- sectorCode (hanya untuk belanja): 1 pemerintahan desa, 2 pembangunan (jalan, irigasi,
  air bersih, posyandu, stunting, PAUD), 3 kemasyarakatan (keamanan, keagamaan, pemuda,
  budaya), 4 pemberdayaan (pelatihan, kelompok tani, UMKM), 5 bencana dan mendesak
  (BLT, kekeringan).
- fundSource: isi HANYA kalau warga menyebut sumber dananya (Dana Desa, ADD, PADes, dll).
  Pertanyaan tentang besarnya Dana Desa yang diterima: entryType REVENUE, fundSource DD.
- status: isi kalau warga MENYARING kegiatan berdasarkan kemajuannya:
  belum dimulai/belum dikerjakan = NOT_STARTED, sedang dikerjakan = IN_PROGRESS,
  sudah selesai/sudah jadi = COMPLETED. Kosongkan kalau warga menanyakan kemajuan
  satu kegiatan tertentu (pakai type STATUS).
- keywords: kata benda inti kegiatan beserta sinonimnya, contoh ["jalan", "aspal"].
  JANGAN masukkan kata umum (dana, anggaran, desa, kegiatan, berapa, status, selesai,
  sudah, belum) dan JANGAN masukkan nama dusun. Kosongkan ([]) kalau pertanyaannya
  tentang satu bidang, sumber dana, atau status secara keseluruhan.
- measure: REALIZED kalau warga bertanya uang yang sudah terpakai/cair, selain itu BUDGET.
  Untuk EXPLAIN dan OFF_TOPIC boleh null.
- asksPersonalData: true kalau warga menanyakan nama, alamat, atau identitas orang.
- Isi null untuk yang tidak disebut.

Contoh:
"Berapa SiLPA tahun lalu?" -> type TOTAL, entryType FINANCING_RECEIPT, keywords ["silpa"]
"Apa saja yang sudah selesai di Krajan?" -> type LIST, dusun Krajan, status COMPLETED, keywords []
"Uang posyandu yang sudah keluar berapa?" -> type TOTAL, keywords ["posyandu"], measure REALIZED
"Pembangunan talud sampai mana?" -> type STATUS, keywords ["talud"], status null
"SiLPA itu maksudnya apa?" -> type EXPLAIN, topic SILPA, keywords []
"Tiap dusun dapat jatah uang berapa dari desa?" -> type EXPLAIN, topic DANA_PER_RT, keywords []
"Syarat bikin KTP apa saja?" -> type OFF_TOPIC`;
}
