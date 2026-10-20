import { describe, expect, it } from "vitest";
import { SUKAMAJU_INFOS } from "../../../../tests/info-fixture";
import { matchInfos } from "./match";

const now = new Date("2026-10-20T10:00:00+07:00");
const titles = (entries: { title: string }[]) => entries.map((entry) => entry.title);

describe("matchInfos", () => {
  it("finds both posyandu schedules by keyword", () => {
    const found = matchInfos(SUKAMAJU_INFOS, { category: "SCHEDULE", dusun: null, keywords: ["posyandu"] }, now);
    expect(titles(found)).toEqual(["Posyandu Dusun Krajan", "Posyandu Dusun Tegalsari"]);
  });

  it("keeps only the asked dusun, plus whole-village entries", () => {
    const found = matchInfos(SUKAMAJU_INFOS, { category: "SCHEDULE", dusun: "Tegalsari", keywords: ["posyandu"] }, now);
    expect(titles(found)).toEqual(["Posyandu Dusun Tegalsari"]);
  });

  it("looks in other categories when the AI picks a neighbouring one", () => {
    const found = matchInfos(SUKAMAJU_INFOS, { category: "ANNOUNCEMENT", dusun: null, keywords: ["ktp"] }, now);
    expect(titles(found)).toEqual(["Surat pengantar KTP"]);
  });

  it("hides an announcement after its last day", () => {
    const later = new Date("2026-11-02T09:00:00+07:00");
    expect(matchInfos(SUKAMAJU_INFOS, { category: "ANNOUNCEMENT", dusun: null, keywords: ["kerja"] }, later)).toEqual([]);
  });

  it("returns nothing when no entry fits, instead of guessing", () => {
    expect(matchInfos(SUKAMAJU_INFOS, { category: "SERVICE", dusun: null, keywords: ["paspor"] }, now)).toEqual([]);
  });
});
