import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

type Row = { code: string; description: string; budget: number | null };

const columns = [
  { header: "kode", value: (row: Row) => row.code },
  { header: "uraian", value: (row: Row) => row.description },
  { header: "anggaran", value: (row: Row) => row.budget },
];

describe("toCsv", () => {
  it("writes a header and one line per row", () => {
    const csv = toCsv([{ code: "2.1.01", description: "Jalan RT 03", budget: 185000000 }], columns);

    expect(csv).toBe("kode,uraian,anggaran\r\n2.1.01,Jalan RT 03,185000000");
  });

  it("quotes cells that contain commas or quotes", () => {
    const csv = toCsv([{ code: "1", description: 'Pagar, "baru"', budget: 1 }], columns);

    expect(csv.split("\r\n")[1]).toBe('1,"Pagar, ""baru""",1');
  });

  it("writes null as an empty cell", () => {
    const csv = toCsv([{ code: "1", description: "x", budget: null }], columns);

    expect(csv.split("\r\n")[1]).toBe("1,x,");
  });
});
