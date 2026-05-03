import type { Metadata } from "next";

import { AttributesAdminPage } from "@/components/admin/attributes-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Product attributes - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <AttributesAdminPage
      initialDefinitions={config.attributeDefinitions}
      initialCategories={config.categories}
    />
  );
}
