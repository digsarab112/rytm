import type { Metadata } from "next";

import { CouponsAdminPage } from "@/components/admin/coupons-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Coupons - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return <CouponsAdminPage initialCoupons={config.coupons} />;
}
