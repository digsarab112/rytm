import type { Metadata } from "next";

import { HomepageSectionsAdminPage } from "@/components/admin/homepage-sections-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Homepage sections - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <HomepageSectionsAdminPage
      initialSections={config.homepageSections}
      products={config.products}
      categories={config.categories}
    />
  );
}
