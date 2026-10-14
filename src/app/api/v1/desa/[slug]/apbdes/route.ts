import { DesaSlugSchema, ItemsQuerySchema } from "@/features/apbdes/schemas";
import {
  getPublishedItems,
  type PublicBudgetItem,
} from "@/features/apbdes/server/apbdes.service";
import { toCsv, type CsvColumn } from "@/lib/csv";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { OPEN_DATA_HEADERS, openDataJson, withErrorHandling } from "@/lib/http";

type Context = { params: Promise<{ slug: string }> };

const CSV_COLUMNS: CsvColumn<PublicBudgetItem>[] = [
  { header: "kode_rekening", value: (item) => item.accountCode },
  { header: "jenis", value: (item) => item.entryType },
  { header: "bidang", value: (item) => item.sectorName },
  { header: "uraian", value: (item) => item.description },
  { header: "dusun", value: (item) => item.dusun },
  { header: "rt", value: (item) => item.rt },
  { header: "sumber_dana", value: (item) => item.fundSourceName },
  { header: "anggaran", value: (item) => item.budget },
  { header: "realisasi", value: (item) => item.realized },
  { header: "status", value: (item) => item.status },
  { header: "keterangan", value: (item) => item.note },
];

// GET /api/v1/desa/sukamaju/apbdes?entryType=EXPENDITURE&sector=2&dusun=Ngemplak&format=csv
export const GET = withErrorHandling(async (request: Request, { params }: Context) => {
  const { slug } = await params;

  const parsedSlug = DesaSlugSchema.safeParse(slug);
  if (!parsedSlug.success) throw new ValidationError(parsedSlug.error.issues[0].message);

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsedQuery = ItemsQuerySchema.safeParse(searchParams);
  if (!parsedQuery.success) {
    const issue = parsedQuery.error.issues[0];
    throw new ValidationError(`Parameter "${issue.path.join(".")}" tidak valid: ${issue.message}`);
  }

  const result = await getPublishedItems(parsedSlug.data, parsedQuery.data);
  if (!result) throw new NotFoundError("APBDes untuk desa ini belum tersedia.");

  if (parsedQuery.data.format === "csv") {
    const fileName = `apbdes-${result.desa.slug}-${result.document.fiscalYear}.csv`;
    // "﻿" tells Excel the file is UTF-8, so Indonesian text displays correctly.
    return new Response("﻿" + toCsv(result.items, CSV_COLUMNS), {
      headers: {
        ...OPEN_DATA_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  }

  return openDataJson(result);
});
