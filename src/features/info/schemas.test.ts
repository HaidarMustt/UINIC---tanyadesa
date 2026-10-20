import { describe, expect, it } from "vitest";
import { InfoFormSchema } from "./schemas";

const valid = {
  id: "",
  category: "SCHEDULE",
  title: "Posyandu Dusun Krajan",
  content: "Setiap tanggal 10 di Balai Dusun Krajan.",
  dusunId: "",
  validUntil: "",
};

describe("InfoFormSchema", () => {
  it("turns empty optional fields into null", () => {
    const parsed = InfoFormSchema.parse(valid);
    expect(parsed).toMatchObject({ id: null, dusunId: null, validUntil: null });
  });

  it("reads the date as midnight WIB", () => {
    const parsed = InfoFormSchema.parse({ ...valid, validUntil: "2026-11-01" });
    expect(parsed.validUntil?.toISOString()).toBe("2026-10-31T17:00:00.000Z");
  });

  it("rejects an unknown category and a too short text", () => {
    expect(InfoFormSchema.safeParse({ ...valid, category: "GOSIP" }).success).toBe(false);
    expect(InfoFormSchema.safeParse({ ...valid, content: "pendek" }).success).toBe(false);
  });
});
