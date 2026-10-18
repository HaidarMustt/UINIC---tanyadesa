import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseApbdesExcel } from "@/features/apbdes/lib/parse-excel";
import { pickExample } from "./pick-example";

const { items } = parseApbdesExcel(readFileSync("tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx"));
const DUSUNS = ["Krajan", "Karangrejo", "Ngemplak", "Tegalsari"];

describe("pickExample", () => {
  it("answers about the RT with the biggest local activity, from the real data", () => {
    const example = pickExample(items, DUSUNS, "Desa Sukamaju");
    expect(example?.question).toBe("Dana untuk RT 3 berapa?");
    expect(example?.answer.status).toBe("ANSWERED");
    expect(example?.answer.text).toContain("Rp185.000.000");
    expect(example?.answer.sources.map((source) => source.accountCode)).toEqual(["2.1.01"]);
  });

  it("returns nothing when no activity belongs to an RT", () => {
    const noRt = items.map((item) => ({ ...item, rt: null }));
    expect(pickExample(noRt, DUSUNS, "Desa Sukamaju")).toBeNull();
  });
});
