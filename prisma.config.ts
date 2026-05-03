import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

const databaseUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
