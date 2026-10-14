// Ask one question to the real AI, using the simulation Excel file (no database needed).
// Run: npx tsx --env-file=.env scripts/ask.ts "Dana jalan RT 3 berapa?"

import { readFileSync } from "node:fs";
import { parseApbdesExcel } from "../src/features/apbdes/lib/parse-excel";
import { ask } from "../src/features/qa/lib/ask";
import { createQaAiProvider } from "../src/features/qa/server/qa-ai";
import { SUKAMAJU_CONTEXT } from "../tests/qa-cases";

async function main() {
  const question = process.argv[2];
  if (!question) throw new Error('Tulis pertanyaannya, contoh: npx tsx --env-file=.env scripts/ask.ts "Dana jalan RT 3 berapa?"');

  const { items } = parseApbdesExcel(readFileSync("tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx"));
  const startedAt = Date.now();
  const result = await ask(question, items, SUKAMAJU_CONTEXT, createQaAiProvider());

  console.log("Niat dari AI:", JSON.stringify(result.intent));
  console.log("Status:", result.status, result.usedAiWording ? "(kalimat dari AI)" : "(kalimat template)");
  console.log("Sumber:", result.sources.map((source) => source.accountCode).join(", ") || "-");
  console.log(`Waktu: ${Date.now() - startedAt} ms\n`);
  console.log(result.text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
