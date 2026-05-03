import type { Metadata } from "next";

import { OrdersAdminPage } from "@/components/admin/orders-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Orders - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <OrdersAdminPage
      initialProducts={config.products}
      initialSuppliers={config.suppliers}
      initialOrders={config.orders}
    />
  );
}
