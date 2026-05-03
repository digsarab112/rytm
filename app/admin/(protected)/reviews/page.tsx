import type { Metadata } from "next";

import { ReviewsAdminPage } from "@/components/admin/reviews-admin-page";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Reviews - Rytm admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const config = await getStorefrontConfig();

  return (
    <ReviewsAdminPage
      initialProducts={config.products}
      initialReviews={config.productReviews}
    />
  );
}
