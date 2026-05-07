import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: databaseUrl });

const repairs = [
  {
    label: "delivery_payment_settings.settings",
    sql: `ALTER TABLE "delivery_payment_settings"
          ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}'`,
  },
  {
    label: "customers.phone unique constraint",
    sql: `ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_phone_key"`,
  },
  {
    label: "customers_phone_key index",
    sql: `DROP INDEX IF EXISTS "customers_phone_key"`,
  },
];

try {
  await client.connect();

  for (const repair of repairs) {
    await client.query(repair.sql);
    console.log(`ok: ${repair.label}`);
  }
} catch (error) {
  console.error("Database repair failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
