import type { Metadata } from "next";

import { ProductsAdminPage } from "@/components/admin/products-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Products - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <ProductsAdminPage
      initialProducts={config.products}
      categories={config.categories}
      attributeDefinitions={config.attributeDefinitions}
      suppliers={config.suppliers}
    />
  );
}
