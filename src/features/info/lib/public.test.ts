import { describe, expect, it } from "vitest";
import { SUKAMAJU_INFOS } from "../../../../tests/info-fixture";
import { toPublicInfos } from "./public";

const now = new Date("2026-10-20T10:00:00+07:00");

describe("toPublicInfos", () => {
  it("filters by category and adds the readable name", () => {
    const services = toPublicInfos(SUKAMAJU_INFOS, "SERVICE", now);
    expect(services).toHaveLength(2);
    expect(services[0].categoryName).toBe("Syarat layanan");
  });

  it("leaves out announcements that have passed", () => {
    const later = new Date("2026-11-05T10:00:00+07:00");
    expect(toPublicInfos(SUKAMAJU_INFOS, "ANNOUNCEMENT", later)).toEqual([]);
  });
});
