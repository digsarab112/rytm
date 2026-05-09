import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../lib/generated/prisma/client";
import { getDefaultStorefrontConfig } from "../lib/platform/storefront-config";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or DIRECT_URL is required to seed homepage sections.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

async function main() {
  const { deliveryInfo, homepageSections } = getDefaultStorefrontConfig();

  for (const section of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { id: section.id },
      update: {
        type: section.type,
        title: section.title ?? {},
        isVisible: section.isVisible,
        sortOrder: section.sortOrder,
        variant: section.variant,
        config: section.config ?? {},
      },
      create: {
        id: section.id,
        type: section.type,
        title: section.title ?? {},
        isVisible: section.isVisible,
        sortOrder: section.sortOrder,
        variant: section.variant,
        config: section.config ?? {},
      },
    });
  }

  await prisma.homepageSection.upsert({
    where: { id: "homepage-benefits-content" },
    update: {
      type: "benefitsContent",
      isVisible: false,
      sortOrder: 1000,
      config: { deliveryInfo },
    },
    create: {
      id: "homepage-benefits-content",
      type: "benefitsContent",
      isVisible: false,
      sortOrder: 1000,
      config: { deliveryInfo },
    },
  });

  console.log(`Seeded ${homepageSections.length + 1} homepage sections.`);
}

main()
  .catch((error) => {
    console.error("Homepage section seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
