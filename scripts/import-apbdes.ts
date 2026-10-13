// Imports the simulation APBDes into the database and publishes it.
// Run: npx tsx --env-file=.env scripts/import-apbdes.ts

import { readFileSync } from "node:fs";
import { importApbdes, publishApbdes } from "../src/features/apbdes/server/apbdes.service";
import { db } from "../src/lib/db";

const FILE_PATH = "tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx";

async function main() {
  const operator = await db.user.findUniqueOrThrow({
    where: { email: "operator@sukamaju.test" },
  });

  const result = await importApbdes({
    desaSlug: "sukamaju",
    fiscalYear: 2026,
    title: "APBDes 2026",
    realizedAsOf: new Date("2026-09-30"),
    fileName: "APBDes_Simulasi_Desa_Sukamaju_2026.xlsx",
    fileUrl: `local://${FILE_PATH}`, // replaced by Supabase Storage in the upload feature
    file: readFileSync(FILE_PATH),
    uploaderId: operator.id,
  });

  console.log(`Dokumen versi ${result.version} tersimpan: ${result.itemCount} baris anggaran.`);

  if (result.warnings.length > 0) {
    console.log("Ada peringatan, dokumen TIDAK diterbitkan:");
    result.warnings.forEach((warning) => console.log(`- ${warning}`));
    return;
  }

  await publishApbdes(result.documentId, operator.id);
  console.log("✅ Dokumen diterbitkan dan sekarang bisa dilihat warga.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());