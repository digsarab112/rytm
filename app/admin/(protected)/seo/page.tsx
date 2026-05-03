import type { Metadata } from "next";

import { SeoSettingsAdminPage } from "@/components/admin/seo-settings-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "SEO settings - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return <SeoSettingsAdminPage initialSettings={config.settings} />;
}
