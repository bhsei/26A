// Prisma CLI configuration. DATABASE_URL is read from the repository-root
// .env file, the same file Docker Compose uses; it is never committed.
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Synthetic demo data (REQ-INST-002); also run by `prisma db seed`.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
