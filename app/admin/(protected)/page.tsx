import type { Metadata } from "next";

import { AdminDashboardPage } from "@/components/admin/admin-dashboard-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Admin dashboard - Rytm",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <AdminDashboardPage
      initialProducts={config.products}
      initialCategories={config.categories}
      initialOrders={config.orders}
    />
  );
}
