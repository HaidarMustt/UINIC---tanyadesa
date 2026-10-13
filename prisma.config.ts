import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Perintah Prisma (migrasi) memakai koneksi session, port 5432
    url: env("DIRECT_URL"),
  },
});
