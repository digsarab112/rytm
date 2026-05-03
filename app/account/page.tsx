import type { Metadata } from "next";

import { CartProvider } from "@/components/cart/cart-provider";
import { CustomerAccountPage } from "@/components/customer/customer-account-page";
import { CustomerShell } from "@/components/customer/customer-shell";
import {
  getCustomerCopy,
  getCustomerLocale,
} from "@/lib/customer/customer-copy";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Customer account - Rytm",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = getCustomerLocale(resolvedSearchParams.locale);
  const copy = getCustomerCopy(locale);
  const config = await getStorefrontConfig();

  return (
    <CustomerShell locale={locale} copy={copy} settings={config.settings}>
      <CartProvider>
        <CustomerAccountPage
          locale={locale}
          copy={copy}
          products={config.products}
        />
      </CartProvider>
    </CustomerShell>
  );
}
