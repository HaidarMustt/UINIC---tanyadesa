// Turns calculated facts into a sentence for residents.
//
// Two paths:
// 1. Template (no AI). Always available, always correct.
// 2. AI rewrites the sentence to sound more natural. The AI may NOT write numbers itself:
//    it may only use placeholders such as {{TOTAL}}, which the code fills in.
//    If the AI writes any digit outside a placeholder, or an unknown placeholder,
//    its text is thrown away and the template is used. This is the "number guard".

import { FUND_SOURCE_NAMES, STATUS_NAMES } from "@/features/apbdes/constants";
import type { ParsedBudgetItem } from "@/features/apbdes/types";
import { formatPercent, formatRupiah } from "@/lib/format";
import type { Facts } from "./calculate";

const MAX_LISTED_ITEMS = 8;
const PRIVACY_NOTE = "Nama dan data pribadi penerima tidak ditampilkan untuk melindungi privasi warga.";

export interface Source {
  accountCode: string;
  description: string;
}

export interface Answer {
  status: "ANSWERED" | "NOT_FOUND" | "REFUSED";
  text: string;
  sources: Source[];
}

// ---------------------------------------------------------------- helpers

function location(item: ParsedBudgetItem): string {
  if (!item.dusun) return "seluruh desa";
  return item.rt ? `Dusun ${item.dusun} RT ${item.rt}` : `Dusun ${item.dusun}`;
}

// Description plus location, without repeating a dusun name already in the description.
function activityName(item: ParsedBudgetItem): string {
  if (item.dusun && item.description.toLowerCase().includes(item.dusun.toLowerCase())) {
    return item.description;
  }
  return `${item.description} (${location(item)})`;
}

function realizationPercent(item: ParsedBudgetItem): number {
  return item.budget === 0 ? 0 : (item.realized / item.budget) * 100;
}

function listLine(item: ParsedBudgetItem, index: number): string {
  return `${index + 1}. ${activityName(item)}: ${formatRupiah(item.budget)}, ${STATUS_NAMES[item.status]}. [${item.accountCode}]`;
}

// ---------------------------------------------------------------- template

export function composeTemplate(facts: Facts, desaName: string): Answer {
  if (facts.status === "REFUSED") {
    const text =
      facts.reason === "PERSONAL_DATA"
        ? `Maaf, TanyaDesa tidak menampilkan data pribadi warga. ${PRIVACY_NOTE}`
        : `Maaf, TanyaDesa hanya bisa menjawab pertanyaan tentang APBDes ${desaName}.`;
    return { status: "REFUSED", text, sources: [] };
  }

  if (facts.status === "NOT_FOUND") {
    return {
      status: "NOT_FOUND",
      text: `Kegiatan itu tidak ditemukan di APBDes ${desaName}. Kalau menurutmu ini dibutuhkan warga, kamu bisa menyampaikannya lewat menu Aspirasi.`,
      sources: [],
    };
  }

  const shown = facts.items.slice(0, MAX_LISTED_ITEMS);
  const hidden = facts.items.length - shown.length;
  const label = facts.measure === "REALIZED" ? "realisasinya" : "anggarannya";
  let text: string;

  if (facts.type === "PERCENTAGE") {
    text = `Besarnya ${formatPercent(facts.percent)}: ${formatRupiah(facts.part)} dari total ${formatRupiah(facts.whole)}.`;
  } else if (facts.items.length === 1) {
    const item = facts.items[0];
    text =
      `${activityName(item)} ${label} ${formatRupiah(facts.total)}, bersumber dari ${FUND_SOURCE_NAMES[item.fundSource]}. ` +
      `Statusnya ${STATUS_NAMES[item.status]}, dengan realisasi ${formatRupiah(item.realized)} (${formatPercent(realizationPercent(item), 0)}).` +
      (item.note ? ` Keterangan: ${item.note}.` : "");
  } else if (facts.type === "LIST") {
    text = `Ada ${facts.items.length} kegiatan:\n` + shown.map(listLine).join("\n");
  } else if (facts.type === "STATUS") {
    text = shown.map(listLine).join("\n");
  } else {
    text = `Totalnya ${formatRupiah(facts.total)} dari ${facts.items.length} kegiatan:\n` + shown.map(listLine).join("\n");
  }

  if (hidden > 0) text += `\n...dan ${hidden} kegiatan lainnya.`;
  if (facts.privacyNote) text += `\n${PRIVACY_NOTE}`;

  return {
    status: "ANSWERED",
    text,
    sources: facts.items.map((item) => ({ accountCode: item.accountCode, description: item.description })),
  };
}

// ---------------------------------------------------------------- placeholders for the AI

export function placeholderValues(facts: Facts): Record<string, string> {
  const values: Record<string, string> = {};
  if (facts.status !== "ANSWERED") return values;

  if (facts.type === "PERCENTAGE") {
    values.PERCENT = formatPercent(facts.percent);
    values.PART = formatRupiah(facts.part);
    values.WHOLE = formatRupiah(facts.whole);
  } else {
    values.TOTAL = formatRupiah(facts.total);
  }
  values.ACTIVITY_COUNT = String(facts.items.length);

  facts.items.slice(0, MAX_LISTED_ITEMS).forEach((item, index) => {
    const prefix = `A${index + 1}_`;
    values[prefix + "NAME"] = activityName(item);
    values[prefix + "CODE"] = item.accountCode;
    values[prefix + "BUDGET"] = formatRupiah(item.budget);
    values[prefix + "REALIZED"] = formatRupiah(item.realized);
    values[prefix + "REALIZED_PERCENT"] = formatPercent(realizationPercent(item), 0);
    values[prefix + "STATUS"] = STATUS_NAMES[item.status];
    values[prefix + "FUND_SOURCE"] = FUND_SOURCE_NAMES[item.fundSource];
    if (item.note) values[prefix + "NOTE"] = item.note;
  });
  return values;
}

// Fills placeholders in the AI's text. Returns null when the AI broke the rules.
export function fillPlaceholders(aiText: string, values: Record<string, string>): string | null {
  const withoutPlaceholders = aiText.replace(/\{\{[A-Z0-9_]+\}\}/g, "");
  if (/\d/.test(withoutPlaceholders)) return null; // the AI wrote a number itself

  let unknownPlaceholder = false;
  const filled = aiText.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key: string) => {
    if (!(key in values)) {
      unknownPlaceholder = true;
      return "";
    }
    return values[key];
  });
  return unknownPlaceholder ? null : filled.trim();
}

export function buildRewritePrompt(question: string, facts: Facts): string {
  const list = Object.entries(placeholderValues(facts))
    .map(([key, value]) => `{{${key}}} = ${value}`)
    .join("\n");
  const privacy =
    facts.status === "ANSWERED" && facts.privacyNote
      ? "\n- Sampaikan bahwa nama penerima tidak ditampilkan demi privasi."
      : "";

  return `Tulis jawaban singkat (maksimal 4 kalimat) dalam bahasa Indonesia sehari-hari yang sopan
untuk pertanyaan warga: "${question}"

Data yang boleh dipakai (tulis PLACEHOLDER-nya, bukan isinya):
${list}

Aturan wajib:
- Jangan pernah menulis angka secara langsung. Semua angka, nama kegiatan, dan kode
  ditulis sebagai placeholder, contoh: "Anggarannya {{A1_BUDGET}}".
- Jangan menambah informasi yang tidak ada di daftar.
- Sebutkan kode rekening sumbernya dengan placeholder CODE.${privacy}`;
}
