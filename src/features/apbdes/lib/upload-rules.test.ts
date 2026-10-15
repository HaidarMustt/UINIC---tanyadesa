import { describe, expect, it } from "vitest";
import { checkUploadedFile, MAX_UPLOAD_BYTES } from "./upload-rules";

describe("checkUploadedFile", () => {
  it("accepts a normal xlsx file", () => {
    expect(checkUploadedFile({ name: "APBDes 2026.xlsx", size: 20_000 })).toBeNull();
  });

  it("rejects a missing or empty file", () => {
    expect(checkUploadedFile(null)).not.toBeNull();
    expect(checkUploadedFile({ name: "kosong.xlsx", size: 0 })).not.toBeNull();
  });

  it("rejects other formats and big files", () => {
    expect(checkUploadedFile({ name: "apbdes.pdf", size: 1000 })).toMatch(/xlsx/);
    expect(checkUploadedFile({ name: "apbdes.xlsx", size: MAX_UPLOAD_BYTES + 1 })).toMatch(/1 MB/);
  });
});
