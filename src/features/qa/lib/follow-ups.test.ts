import { describe, expect, it } from "vitest";
import { makeIntent } from "../../../../tests/qa-cases";
import type { Answer } from "./compose-answer";
import { suggestFollowUps } from "./follow-ups";

const DUSUNS = ["Krajan", "Karangrejo", "Ngemplak", "Tegalsari"];
const answered = (kind: Answer["kind"]): Answer => ({ status: "ANSWERED", kind, text: "...", sources: [] });

describe("suggestFollowUps", () => {
  it("offers the realised amount and another dusun after a dusun total", () => {
    const intent = makeIntent({ entryType: "EXPENDITURE", dusun: "Ngemplak" });
    expect(suggestFollowUps(intent, answered("APBDES"), "Total belanja Ngemplak?", DUSUNS)).toEqual([
      "Yang sudah terpakai berapa?",
      "Apa saja yang sudah selesai di Dusun Ngemplak?",
      "Kalau di Dusun Krajan?",
    ]);
  });

  it("offers other services after an Info desa answer, never the same question", () => {
    const suggestions = suggestFollowUps(makeIntent({ type: "INFO" }), answered("INFO"), "Kapan jadwal posyandu?", DUSUNS);
    expect(suggestions).not.toContain("Kapan jadwal posyandu?");
    expect(suggestions).toContain("Kantor desa buka jam berapa?");
  });

  it("always offers something, even when the question was not understood", () => {
    const refused: Answer = { status: "REFUSED", kind: "APBDES", text: "...", sources: [] };
    expect(suggestFollowUps(null, refused, "???", DUSUNS)).toHaveLength(3);
  });
});
