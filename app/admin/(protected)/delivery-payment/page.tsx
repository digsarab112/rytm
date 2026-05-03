import type { Metadata } from "next";

import { DeliveryPaymentAdminPage } from "@/components/admin/delivery-payment-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Delivery and payment - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <DeliveryPaymentAdminPage
      initialSettings={config.deliveryPayment}
    />
  );
}
