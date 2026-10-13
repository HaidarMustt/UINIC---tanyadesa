import { db } from "../src/lib/db";

async function main() {
  const desa = await db.desa.findUnique({
    where: { slug: "sukamaju" },
    include: { dusuns: true },
  });

  console.log("Desa:", desa?.name);
  console.log("Dusun:", desa?.dusuns.map((d) => d.name).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());