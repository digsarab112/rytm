import type { Metadata } from "next";

import { CustomersAdminPage } from "@/components/admin/customers-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Customers - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <CustomersAdminPage
      initialCustomers={config.customers}
      initialOrders={config.orders}
    />
  );
}
