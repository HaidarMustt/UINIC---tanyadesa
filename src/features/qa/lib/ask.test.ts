import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseApbdesExcel } from "@/features/apbdes/lib/parse-excel";
import { QA_TEST_CASES, SUKAMAJU_CONTEXT, makeIntent } from "../../../../tests/qa-cases";
import { ask, type AiProvider } from "./ask";
import { fillPlaceholders } from "./compose-answer";
import { cleanKeywords } from "./filter-items";

const FIXTURE = "tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx";
const { items } = parseApbdesExcel(readFileSync(FIXTURE));

// A fake AI that always returns the given intent.
const fakeAi = (intent: unknown): AiProvider => ({ understandIntent: async () => intent });

describe("ask: the test questions", () => {
  for (const testCase of QA_TEST_CASES) {
    it(testCase.question, async () => {
      const result = await ask(testCase.question, items, SUKAMAJU_CONTEXT, fakeAi(testCase.fakeIntent));

      expect(result.status).toBe(testCase.expectedStatus);
      expect(result.sources.map((source) => source.accountCode)).toEqual(testCase.expectedCodes);
      if (testCase.expectedText) expect(result.text).toContain(testCase.expectedText);
    });
  }
});

describe("ask: explaining terms", () => {
  // Found on the live site (17 Oct 2026): "apa itu bumdes" answered "kegiatan tidak ditemukan".
  it("explains BUMDes and shows the rows where it appears", async () => {
    const intent = makeIntent({ type: "EXPLAIN", topic: "BUMDES" });
    const result = await ask("apa itu bumdes", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.status).toBe("ANSWERED");
    expect(result.text).toContain("Badan Usaha Milik Desa");
    expect(result.sources.map((source) => source.accountCode)).toEqual(["4.1.1", "6.2.2"]);
  });

  // Found in the Vercel log (17 Oct 2026): the model wrote measure null for an EXPLAIN question
  // and the provider rejected it, so the resident saw "sedang sibuk".
  it("accepts an intent without a measure", async () => {
    const intent = makeIntent({ type: "EXPLAIN", topic: null, measure: null });
    const result = await ask("apa itu musrenbangdes", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.status).toBe("NOT_FOUND");
  });

  it("reads a missing measure as the budget", async () => {
    const intent = makeIntent({ entryType: "REVENUE", fundSource: "DD", measure: null });
    const result = await ask("Berapa Dana Desa?", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.text).toContain("Rp939.000.000");
  });

  it("says honestly when a term has no explanation yet", async () => {
    const intent = makeIntent({ type: "EXPLAIN", topic: null });
    const result = await ask("apa itu musrenbangdes", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.status).toBe("NOT_FOUND");
    expect(result.text).toContain("belum tersedia");
    expect(result.text).not.toContain("Kegiatan itu");
  });
});

describe("ask: safety", () => {
  it("refuses a question only about a person", async () => {
    const intent = makeIntent({ keywords: ["budi"], asksPersonalData: true });
    const result = await ask("Rumah Pak Budi di mana?", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.status).toBe("REFUSED");
  });

  it("does not answer when the AI returns a broken intent", async () => {
    const result = await ask("Halo?", items, SUKAMAJU_CONTEXT, fakeAi({ type: "NONSENSE" }));
    expect(result.status).toBe("REFUSED");
    expect(result.sources).toEqual([]);
  });

  it("ignores generic words the AI adds to keywords", async () => {
    // Without cleaning, "dana" would match the revenue row "Dana Desa".
    const intent = makeIntent({ dusun: "Krajan", keywords: ["dana", "jalan"] });
    const result = await ask("Dana jalan di Krajan berapa?", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.sources.map((source) => source.accountCode)).toEqual(["2.1.01"]);
  });
});

describe("number guard", () => {
  const values = { A1_BUDGET: "Rp185.000.000", A1_CODE: "2.1.01" };

  it("accepts text that only uses placeholders", () => {
    expect(fillPlaceholders("Anggarannya {{A1_BUDGET}} [{{A1_CODE}}].", values)).toBe(
      "Anggarannya Rp185.000.000 [2.1.01].",
    );
  });

  it("rejects text where the AI wrote a number itself", () => {
    expect(fillPlaceholders("Anggarannya Rp200 juta.", values)).toBeNull();
  });

  it("rejects unknown placeholders", () => {
    expect(fillPlaceholders("Totalnya {{TOTAL}}.", values)).toBeNull();
  });

  it("keeps the correct number even when the AI invents one", async () => {
    const ai: AiProvider = {
      understandIntent: async () => makeIntent({ rt: "3", keywords: ["jalan"] }),
      rewrite: async () => "Anggaran jalan RT 3 sebesar Rp250 juta.",
    };
    const result = await ask("Dana jalan RT 3?", items, SUKAMAJU_CONTEXT, ai);
    expect(result.usedAiWording).toBe(false);
    expect(result.text).toContain("Rp185.000.000");
  });

  it("uses the AI wording when it passes the guard", async () => {
    const ai: AiProvider = {
      understandIntent: async () => makeIntent({ rt: "3", keywords: ["jalan"] }),
      rewrite: async () => "Untuk {{A1_NAME}}, anggarannya {{A1_BUDGET}} dan {{A1_STATUS}} (kode {{A1_CODE}}).",
    };
    const result = await ask("Dana jalan RT 3?", items, SUKAMAJU_CONTEXT, ai);
    expect(result.usedAiWording).toBe(true);
    expect(result.text).toContain("Rp185.000.000");
  });
});

describe("cleanKeywords", () => {
  it("removes generic words and dusun names", () => {
    expect(cleanKeywords(["Dana", "jalan", "Krajan", "status"], ["Krajan"])).toEqual(["jalan"]);
  });

  it("removes words already covered by the entry type", () => {
    expect(cleanKeywords(["belanja", "Pendapatan"], [])).toEqual([]);
  });

  it("totals a dusun even when the AI adds 'belanja' as a keyword", async () => {
    // Found during the real-AI evaluation (16 Oct 2026): "belanja" cut 3 rows down to 0.
    const intent = makeIntent({ entryType: "EXPENDITURE", dusun: "Ngemplak", keywords: ["belanja"] });
    const result = await ask("Total belanja untuk Dusun Ngemplak berapa?", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.sources.map((source) => source.accountCode)).toEqual(["2.1.04", "2.1.07", "5.2.02"]);
  });

  it("removes words of the chosen sector's name", () => {
    expect(cleanKeywords(["pembangunan"], [], 2)).toEqual([]);
  });

  it("answers the whole sector even when the AI repeats the sector name", async () => {
    // Found during the real-AI evaluation: "pembangunan" as keyword cut 11 rows down to 3.
    const intent = makeIntent({ type: "PERCENTAGE", entryType: "EXPENDITURE", sectorCode: 2, keywords: ["pembangunan"] });
    const result = await ask("Berapa persen belanja untuk pembangunan?", items, SUKAMAJU_CONTEXT, fakeAi(intent));
    expect(result.sources).toHaveLength(11);
    expect(result.text).toContain("53,0%");
  });
});
