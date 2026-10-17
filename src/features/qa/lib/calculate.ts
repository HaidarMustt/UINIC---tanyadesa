// Turns an intent plus budget rows into calculated facts. Pure function.
// Every number a resident will see comes from here.

import type { ParsedBudgetItem } from "@/features/apbdes/types";
import { filterItems } from "./filter-items";
import { relatedRows, type GlossaryTopic } from "./glossary";
import type { Intent } from "./intent";

export type Facts =
  | {
      status: "ANSWERED";
      type: "TOTAL" | "LIST" | "STATUS";
      measure: Intent["measure"];
      total: number;
      items: ParsedBudgetItem[];
      privacyNote: boolean;
    }
  | {
      status: "ANSWERED";
      type: "PERCENTAGE";
      measure: Intent["measure"];
      part: number;
      whole: number;
      percent: number;
      items: ParsedBudgetItem[];
      privacyNote: boolean;
    }
  | {
      status: "ANSWERED";
      type: "EXPLAIN";
      topic: GlossaryTopic;
      items: ParsedBudgetItem[]; // rows of this APBDes that belong to the topic, may be empty
      privacyNote: false;
    }
  | { status: "NOT_FOUND"; unknownTerm?: true }
  | { status: "REFUSED"; reason: "OFF_TOPIC" | "PERSONAL_DATA" };

export function calculate(intent: Intent, items: ParsedBudgetItem[], dusuns: string[]): Facts {
  if (intent.type === "OFF_TOPIC") return { status: "REFUSED", reason: "OFF_TOPIC" };

  // Explanations come from the fixed glossary; only related numbers come from the rows.
  if (intent.type === "EXPLAIN") {
    if (!intent.topic) return { status: "NOT_FOUND", unknownTerm: true };
    return { status: "ANSWERED", type: "EXPLAIN", topic: intent.topic, items: relatedRows(intent.topic, items), privacyNote: false };
  }

  const matched = filterItems(items, intent, dusuns);
  if (matched.length === 0) {
    // A question only about a person's identity, with no matching activity: refuse.
    if (intent.asksPersonalData) return { status: "REFUSED", reason: "PERSONAL_DATA" };
    return { status: "NOT_FOUND" };
  }

  const valueOf = (item: ParsedBudgetItem) =>
    intent.measure === "REALIZED" ? item.realized : item.budget;
  const sum = (rows: ParsedBudgetItem[]) => rows.reduce((total, item) => total + valueOf(item), 0);
  const privacyNote = intent.asksPersonalData;

  if (intent.type === "PERCENTAGE") {
    // Compare against all rows of the same entry type (default: expenditure).
    const entryType = intent.entryType ?? "EXPENDITURE";
    const whole = sum(items.filter((item) => item.entryType === entryType));
    const part = sum(matched);
    const percent = whole === 0 ? 0 : (part / whole) * 100;
    return { status: "ANSWERED", type: "PERCENTAGE", measure: intent.measure, part, whole, percent, items: matched, privacyNote };
  }

  return { status: "ANSWERED", type: intent.type, measure: intent.measure, total: sum(matched), items: matched, privacyNote };
}
