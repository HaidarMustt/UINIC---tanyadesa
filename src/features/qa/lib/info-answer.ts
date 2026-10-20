// Answers an INFO question (schedules, service requirements, announcements, contacts)
// from Info desa written by officers. The words come from the officers, not from the AI.

import { matchInfos } from "@/features/info/lib/match";
import type { InfoEntry } from "@/features/info/types";
import { formatDate } from "@/lib/format";
import type { Answer } from "./compose-answer";
import type { Intent } from "./intent";

export function answerFromInfo(intent: Intent, entries: InfoEntry[], desaName: string, now: Date = new Date()): Answer {
  const found = matchInfos(entries, { category: intent.infoCategory, dusun: intent.dusun, keywords: intent.keywords }, now);

  if (found.length === 0) {
    return {
      status: "NOT_FOUND",
      kind: "INFO",
      text: `Belum ada info tentang itu dari kantor ${desaName}. Silakan tanyakan langsung ke kantor desa, atau sampaikan lewat menu Aspirasi.`,
      sources: [],
    };
  }

  return {
    status: "ANSWERED",
    kind: "INFO",
    text: found.map((entry) => `${entry.title}:\n${entry.content}`).join("\n\n"),
    sources: found.map((entry) => ({
      accountCode: "Info desa",
      description: `${entry.title}, diperbarui ${formatDate(entry.updatedAt)}`,
    })),
  };
}
