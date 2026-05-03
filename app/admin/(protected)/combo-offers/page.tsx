import type { Metadata } from "next";

import { ComboOffersAdminPage } from "@/components/admin/combo-offers-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Combo offers - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return <ComboOffersAdminPage initialProducts={config.products} />;
}
