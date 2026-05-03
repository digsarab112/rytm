import type { Metadata } from "next";

import { SiteSettingsAdminPage } from "@/components/admin/site-settings-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Site settings - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <SiteSettingsAdminPage
      initialSettings={config.settings}
      products={config.products}
    />
  );
}
