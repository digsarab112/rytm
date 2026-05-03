import type { Metadata } from "next";

import { SuppliersAdminPage } from "@/components/admin/suppliers-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Suppliers - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return <SuppliersAdminPage initialSuppliers={config.suppliers} />;
}
