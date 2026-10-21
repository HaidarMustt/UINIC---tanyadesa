import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_VILLAGE_INFOS } from "./demo-infos";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const SECTORS = [
  { code: 1, name: "Penyelenggaraan Pemerintahan Desa" },
  { code: 2, name: "Pelaksanaan Pembangunan Desa" },
  { code: 3, name: "Pembinaan Kemasyarakatan Desa" },
  { code: 4, name: "Pemberdayaan Masyarakat Desa" },
  { code: 5, name: "Penanggulangan Bencana, Keadaan Darurat dan Mendesak" },
];

const DUSUNS = [
  { name: "Krajan", rts: ["01", "02", "03"] },
  { name: "Karangrejo", rts: ["04", "05", "06"] },
  { name: "Ngemplak", rts: ["07", "08", "09"] },
  { name: "Tegalsari", rts: ["10", "11", "12"] },
];

const ASPIRATION_CATEGORIES = [
  "Jalan dan infrastruktur",
  "Penerangan jalan",
  "Air bersih dan irigasi",
  "Kesehatan dan stunting",
  "Pertanian, UMKM, dan pelatihan",
  "Bantuan sosial",
  "Keamanan dan ketertiban",
  "Lainnya",
];


async function main() {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) throw new Error("DEMO_PASSWORD belum diatur di .env");

  for (const sector of SECTORS) {
    await prisma.sector.upsert({
      where: { code: sector.code },
      update: { name: sector.name },
      create: sector,
    });
  }

  const desa = await prisma.desa.upsert({
    where: { slug: "sukamaju" },
    update: {},
    create: {
      slug: "sukamaju",
      name: "Desa Sukamaju",
      district: "Kecamatan Contoh",
      regency: "Kabupaten Simulasi",
      population: 4180,
      householdCount: 1265,
      isSimulation: true,
    },
  });

  const dusunIds = new Map<string, string>();
  for (const dusun of DUSUNS) {
    const saved = await prisma.dusun.upsert({
      where: { desaId_name: { desaId: desa.id, name: dusun.name } },
      update: { rts: dusun.rts },
      create: { desaId: desa.id, ...dusun },
    });
    dusunIds.set(saved.name, saved.id);
  }

  for (const name of ASPIRATION_CATEGORIES) {
    await prisma.aspirationCategory.upsert({
      where: { desaId_name: { desaId: desa.id, name } },
      update: {},
      create: { desaId: desa.id, name },
    });
  }

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const demoUsers = [
    { email: "operator@sukamaju.test", name: "Operator Desa Sukamaju", role: "OPERATOR" },
    { email: "bpd@sukamaju.test", name: "BPD Desa Sukamaju", role: "BPD" },
  ] as const;

  let operatorId = "";
  for (const user of demoUsers) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash },
      create: { ...user, desaId: desa.id, passwordHash },
    });
    if (user.role === "OPERATOR") operatorId = saved.id;
  }

  // Info desa: created once; later edits made in the panel are not overwritten.
  for (const info of DEMO_VILLAGE_INFOS) {
    const data = {
      category: info.category,
      title: info.title,
      content: info.content,
      dusunId: info.dusun ? (dusunIds.get(info.dusun) ?? null) : null,
      validUntil: info.validUntil,
    };
    await prisma.villageInfo.upsert({
      where: { desaId_title: { desaId: desa.id, title: info.title } },
      update: {},
      create: { ...data, desaId: desa.id, updatedById: operatorId },
    });
  }

  console.log(
    `✅ Seed selesai: Desa Sukamaju, 4 dusun, 5 bidang, 8 kategori, 2 akun demo, ${DEMO_VILLAGE_INFOS.length} info desa`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
