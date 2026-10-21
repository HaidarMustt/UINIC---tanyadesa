// Puts the simulated Desa Sukamaju back to its demo state, e.g. after judges have tried the panel.
// Run: npx tsx --env-file=.env scripts/reset-demo.ts
//
// What it does (and what it leaves alone):
// 1. Deletes APBDes drafts that were uploaded but never published.
// 2. If the published APBDes differs from docs/contoh (version 2), imports and publishes it again.
//    Older versions stay archived, as always.
// 3. Restores the demo Info desa entries; other entries are hidden, not deleted.
// 4. Sets the two demo accounts' password back to DEMO_PASSWORD.
// Questions, ratings and aspirations stay: they are the history of what people did.

import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { DEMO_VILLAGE_INFOS } from "../prisma/demo-infos";
import { parseApbdesExcel } from "../src/features/apbdes/lib/parse-excel";
import { importApbdes, publishApbdes } from "../src/features/apbdes/server/apbdes.service";
import { db } from "../src/lib/db";

const DESA_SLUG = "sukamaju";
const BASELINE_FILE = "docs/contoh/APBDes_Simulasi_Desa_Sukamaju_2026_v2.xlsx";
const DEMO_EMAILS = ["operator@sukamaju.test", "bpd@sukamaju.test"];

// One line per budget row; equal lists mean the same APBDes content.
function signature(rows: { accountCode: string; budget: number | bigint; realized: number | bigint; status: string }[]) {
  return rows
    .map((row) => `${row.accountCode}|${row.budget}|${row.realized}|${row.status}`)
    .sort()
    .join("\n");
}

async function main() {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) throw new Error("DEMO_PASSWORD belum diatur di .env");

  const desa = await db.desa.findUniqueOrThrow({
    where: { slug: DESA_SLUG },
    select: { id: true, dusuns: { select: { id: true, name: true } } },
  });
  const operator = await db.user.findUniqueOrThrow({ where: { email: DEMO_EMAILS[0] } });

  // 1. Unpublished drafts
  const drafts = await db.apbdesDocument.deleteMany({
    where: { desaId: desa.id, status: { in: ["UPLOADED", "PROCESSING", "IN_REVIEW", "FAILED"] } },
  });
  console.log(`1. Draf APBDes yang dihapus: ${drafts.count}`);

  // 2. Published APBDes
  const file = readFileSync(BASELINE_FILE);
  const baseline = signature(parseApbdesExcel(file).items);
  const published = await db.apbdesDocument.findFirst({
    where: { desaId: desa.id, status: "PUBLISHED" },
    select: { id: true, items: { select: { accountCode: true, budget: true, realized: true, status: true } } },
  });

  if (published && signature(published.items) === baseline) {
    console.log("2. APBDes yang terbit sudah sama dengan versi demo. Tidak diubah.");
  } else {
    const result = await importApbdes({
      desaSlug: DESA_SLUG,
      fiscalYear: 2026,
      title: "APBDes 2026",
      realizedAsOf: new Date("2026-10-31T00:00:00+07:00"),
      fileName: "APBDes_Simulasi_Desa_Sukamaju_2026_v2.xlsx",
      fileUrl: `local://${BASELINE_FILE}`,
      file,
      uploaderId: operator.id,
    });
    if (result.warnings.length > 0) {
      console.log("2. File demo punya peringatan, TIDAK diterbitkan:");
      result.warnings.forEach((warning) => console.log(`   - ${warning}`));
    } else {
      await publishApbdes(result.documentId, operator.id);
      console.log(`2. APBDes demo diterbitkan ulang sebagai versi ${result.version}.`);
    }
  }

  // 3. Info desa
  const dusunId = (name: string | null) => desa.dusuns.find((dusun) => dusun.name === name)?.id ?? null;
  for (const info of DEMO_VILLAGE_INFOS) {
    const data = {
      category: info.category,
      content: info.content,
      dusunId: dusunId(info.dusun),
      validUntil: info.validUntil,
      isPublished: true,
      updatedById: operator.id,
    };
    await db.villageInfo.upsert({
      where: { desaId_title: { desaId: desa.id, title: info.title } },
      update: data,
      create: { ...data, title: info.title, desaId: desa.id },
    });
  }
  const hidden = await db.villageInfo.updateMany({
    where: { desaId: desa.id, title: { notIn: DEMO_VILLAGE_INFOS.map((info) => info.title) }, isPublished: true },
    data: { isPublished: false },
  });
  console.log(`3. Info desa demo dipulihkan (${DEMO_VILLAGE_INFOS.length}); info lain disembunyikan: ${hidden.count}`);

  // 4. Demo accounts
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const accounts = await db.user.updateMany({
    where: { email: { in: DEMO_EMAILS } },
    data: { passwordHash, isActive: true },
  });
  console.log(`4. Password akun demo dikembalikan: ${accounts.count} akun`);

  console.log("✅ Data demo kembali ke kondisi awal.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
