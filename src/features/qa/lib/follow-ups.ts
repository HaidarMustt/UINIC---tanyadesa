// Two or three next questions shown under an answer, so the conversation keeps going.
// Made by code from what was just asked: no AI call, no quota used.
// Short ones ("Yang sudah terpakai berapa?") are follow-ups the AI understands
// because the previous question is sent along.

import type { Answer } from "./compose-answer";
import type { Intent } from "./intent";

const MAX_SUGGESTIONS = 3;

const GENERAL = [
  "Kegiatan apa saja yang belum dimulai?",
  "Berapa persen belanja untuk pembangunan?",
  "Apa itu Dana Desa?",
];

const INFO_QUESTIONS = ["Kapan jadwal posyandu?", "Syarat bikin surat pengantar KTP apa?", "Kantor desa buka jam berapa?"];

const TERM_QUESTIONS = ["Apa itu APBDes?", "Apa itu SiLPA?", "Bedanya anggaran sama realisasi apa?", "Apa itu BUMDes?"];

export function suggestFollowUps(intent: Intent | null, answer: Answer, question: string, dusuns: string[]): string[] {
  const ideas: string[] = [];

  if (intent && answer.kind === "APBDES" && answer.status === "ANSWERED") {
    if (intent.type === "TOTAL" && intent.measure !== "REALIZED") ideas.push("Yang sudah terpakai berapa?");
    if (intent.dusun) {
      ideas.push(`Apa saja yang sudah selesai di Dusun ${intent.dusun}?`);
      const other = dusuns.find((dusun) => dusun !== intent.dusun);
      if (other) ideas.push(`Kalau di Dusun ${other}?`);
    } else if (intent.rt) {
      ideas.push(`Kegiatan apa saja di RT ${intent.rt}?`);
    }
  }
  if (answer.kind === "INFO") ideas.push(...INFO_QUESTIONS);
  if (answer.kind === "TERM") ideas.push(...TERM_QUESTIONS);
  ideas.push(...GENERAL);

  const asked = question.trim().toLowerCase();
  return [...new Set(ideas)].filter((idea) => idea.toLowerCase() !== asked).slice(0, MAX_SUGGESTIONS);
}
