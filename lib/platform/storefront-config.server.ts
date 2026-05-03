import "server-only";

import {
  getDefaultStorefrontConfig,
  mergeStorefrontConfig,
} from "@/lib/platform/storefront-config";
import { readDatabaseStorefrontConfig } from "@/lib/platform/storefront-database";
import { readStorefrontConfigOverrides } from "@/lib/platform/storefront-overrides-store";

export async function getStorefrontConfig() {
  const databaseConfig = await readDatabaseStorefrontConfig();

  if (databaseConfig) {
    return databaseConfig;
  }

  return mergeStorefrontConfig(
    getDefaultStorefrontConfig(),
    await readStorefrontConfigOverrides(),
  );
}
