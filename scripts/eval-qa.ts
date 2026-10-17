// Runs all test questions against the REAL AI and reports accuracy.
// The result is evidence for the "Hasil Pengujian" chapter of the proposal.
// Run: npx tsx --env-file=.env scripts/eval-qa.ts

import { readFileSync } from "node:fs";
import { parseApbdesExcel } from "../src/features/apbdes/lib/parse-excel";
import { ask } from "../src/features/qa/lib/ask";
import { createQaAiProvider } from "../src/features/qa/server/qa-ai";
import { QA_TEST_CASES, SUKAMAJU_CONTEXT } from "../tests/qa-cases";

// Groq's free tier allows 8,000 tokens per minute and one question uses about 2,400,
// so at most 3 questions fit in a minute. 20 s between questions stays under the limit.
const PAUSE_BETWEEN_QUESTIONS_MS = 20_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sameCodes = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((code, index) => code === [...b].sort()[index]);

async function main() {
  const { items } = parseApbdesExcel(readFileSync("tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx"));
  const ai = createQaAiProvider();
  let correct = 0;

  for (const [index, testCase] of QA_TEST_CASES.entries()) {
    if (index > 0) await sleep(PAUSE_BETWEEN_QUESTIONS_MS);
    let result;
    try {
      result = await ask(testCase.question, items, SUKAMAJU_CONTEXT, ai);
    } catch (error) {
      // A failed request counts as wrong, but the remaining questions still run.
      console.log(`⚠️ ${index + 1}. ${testCase.question}\n   gagal dipanggil: ${(error as Error).message.slice(0, 120)}`);
      continue;
    }
    const codes = result.sources.map((source) => source.accountCode);
    const isCorrect =
      result.status === testCase.expectedStatus && sameCodes(codes, testCase.expectedCodes);
    if (isCorrect) correct++;

    console.log(`${isCorrect ? "✅" : "❌"} ${index + 1}. ${testCase.question}`);
    if (!isCorrect) {
      console.log(`   diharapkan: ${testCase.expectedStatus} [${testCase.expectedCodes.join(", ")}]`);
      console.log(`   didapat   : ${result.status} [${codes.join(", ")}]`);
      console.log(`   niat AI   : ${JSON.stringify(result.intent)}`);
    }
  }

  console.log(`\nKetepatan: ${correct}/${QA_TEST_CASES.length} (${Math.round((correct / QA_TEST_CASES.length) * 100)}%)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
