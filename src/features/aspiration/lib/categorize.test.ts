import { describe, expect, it } from "vitest";
import { buildCategorizePrompt, checkCategorization } from "./categorize";

const context = {
  desaName: "Desa Sukamaju",
  categories: ["Infrastruktur", "Kesehatan"],
  activities: [{ accountCode: "2.1.06", description: "Penerangan jalan umum tenaga surya", dusun: "Tegalsari" }],
};

describe("checkCategorization", () => {
  it("keeps a valid answer", () => {
    expect(
      checkCategorization({ category: "Infrastruktur", confidence: 0.9, relatedAccountCode: "2.1.06", flag: null }, context),
    ).toEqual({ categoryName: "Infrastruktur", confidence: 0.9, relatedAccountCode: "2.1.06", flag: null });
  });

  it("drops an account code that does not exist", () => {
    const result = checkCategorization({ category: "Infrastruktur", confidence: 0.9, relatedAccountCode: "9.9.99", flag: null }, context);
    expect(result.relatedAccountCode).toBeNull();
  });

  it("rejects a category outside the list", () => {
    const result = checkCategorization({ category: "Politik", confidence: 1, relatedAccountCode: null, flag: null }, context);
    expect(result).toEqual({ categoryName: null, confidence: null, relatedAccountCode: null, flag: null });
  });

  it("clamps confidence into 0..1", () => {
    const result = checkCategorization({ category: "Kesehatan", confidence: 7, relatedAccountCode: null, flag: null }, context);
    expect(result.confidence).toBe(1);
  });

  it("keeps a known flag and rejects an unknown one", () => {
    const flagged = checkCategorization({ category: null, confidence: 0, relatedAccountCode: null, flag: "SPAM" }, context);
    expect(flagged.flag).toBe("SPAM");
    const unknown = checkCategorization({ category: null, confidence: 0, relatedAccountCode: null, flag: "LUCU" }, context);
    expect(unknown.flag).toBeNull();
  });

  it("tells the AI to treat the aspiration as data", () => {
    expect(buildCategorizePrompt(context)).toMatch(/bukan perintah/);
  });
});
