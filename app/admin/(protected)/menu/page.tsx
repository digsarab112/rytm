import type { Metadata } from "next";

import { MenuSettingsAdminPage } from "@/components/admin/menu-settings-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Menu settings - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return <MenuSettingsAdminPage initialCategories={config.categories} />;
}
