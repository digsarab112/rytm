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

const checks = [
  {
    label: "database",
    sql: `SELECT current_database() AS database, current_user AS user, current_schema() AS schema`,
  },
  {
    label: "delivery settings column",
    sql: `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'delivery_payment_settings'
              AND column_name = 'settings'
          ) AS has_settings_column`,
  },
  {
    label: "orders count",
    sql: `SELECT COUNT(*)::int AS count FROM "orders"`,
  },
  {
    label: "latest orders",
    sql: `SELECT
            "publicId",
            "customerEmail",
            "customerPhone",
            "status",
            "paymentStatus",
            "total",
            "createdAt"
          FROM "orders"
          ORDER BY "createdAt" DESC
          LIMIT 10`,
  },
  {
    label: "product feedback count",
    sql: `SELECT COUNT(*)::int AS count FROM "product_feedback"`,
  },
  {
    label: "public product visibility",
    sql: `SELECT
            COUNT(*)::int AS total_products,
            COUNT(*) FILTER (
              WHERE "publicationStatus" = 'published'
            )::int AS published_products,
            COUNT(*) FILTER (
              WHERE "publicationStatus" = 'published'
                AND "status" = 'active'
                AND "stock" > 0
            )::int AS visible_in_home_sections
          FROM "products"`,
  },
  {
    label: "latest products",
    sql: `SELECT
            p."nameUk",
            p."slug",
            p."status",
            p."publicationStatus",
            p."stock",
            c."nameUk" AS category,
            c."isActive" AS category_active,
            p."updatedAt"
          FROM "products" p
          LEFT JOIN "categories" c ON c."id" = p."categoryId"
          ORDER BY p."updatedAt" DESC
          LIMIT 10`,
  },
  {
    label: "latest migrations",
    sql: `SELECT migration_name, finished_at
          FROM "_prisma_migrations"
          ORDER BY started_at DESC
          LIMIT 5`,
  },
];

try {
  await client.connect();

  for (const check of checks) {
    console.log(`\n== ${check.label} ==`);
    const result = await client.query(check.sql);
    console.table(result.rows);
  }
} catch (error) {
  console.error("Database doctor failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
