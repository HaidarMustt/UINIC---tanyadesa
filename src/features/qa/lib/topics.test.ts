import { describe, expect, it } from "vitest";
import { buildTopics } from "./topics";

describe("buildTopics", () => {
  it("uses the desa's own dusun names", () => {
    const dusun = buildTopics(["Krajan", "Ngemplak"]).find((topic) => topic.id === "dusun");
    expect(dusun?.questions).toContain("Berapa total belanja Dusun Krajan?");
    expect(dusun?.questions).toContain("Kegiatan di Dusun Ngemplak apa saja?");
  });

  it("still offers questions when a desa has no dusun", () => {
    for (const topic of buildTopics([])) expect(topic.questions.length).toBeGreaterThan(0);
  });
});
