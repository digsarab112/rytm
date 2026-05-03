import type { Metadata } from "next";

import { CategoriesAdminPage } from "@/components/admin/categories-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Categories - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return <CategoriesAdminPage initialCategories={config.categories} />;
}
