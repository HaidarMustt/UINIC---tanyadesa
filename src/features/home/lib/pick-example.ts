// Picks a real question and answer to show on the welcome page.
// The answer is made by the same code that answers residents (calculate + template),
// without calling the AI, so the example always matches the published APBDes.

import type { ParsedBudgetItem } from "@/features/apbdes/types";
import { calculate } from "@/features/qa/lib/calculate";
import { composeTemplate, type Answer } from "@/features/qa/lib/compose-answer";
import type { Intent } from "@/features/qa/lib/intent";

export interface WelcomeExample {
  question: string;
  answer: Answer;
}

// The biggest activity that belongs to one RT: concrete and easy to relate to.
export function pickExample(
  items: ParsedBudgetItem[],
  dusuns: string[],
  desaName: string,
): WelcomeExample | null {
  const local = items
    .filter((item) => item.entryType === "EXPENDITURE" && item.rt !== null && /^\d+$/.test(item.rt))
    .sort((a, b) => b.budget - a.budget)[0];
  if (!local?.rt) return null;

  const rt = String(Number(local.rt)); // "03" -> "3", the way residents write it
  const intent: Intent = {
    type: "TOTAL",
    topic: null,
    entryType: "EXPENDITURE",
    sectorCode: null,
    dusun: null,
    rt,
    fundSource: null,
    status: null,
    keywords: [],
    measure: "BUDGET",
    asksPersonalData: false,
  };

  const answer = composeTemplate(calculate(intent, items, dusuns), desaName);
  if (answer.status !== "ANSWERED") return null;
  return { question: `Dana untuk RT ${rt} berapa?`, answer };
}
