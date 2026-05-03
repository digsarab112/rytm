import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutPage } from "@/components/checkout/checkout-page";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  const config = await getStorefrontConfig();

  return {
    title: `${dictionary.checkout.title} - ${config.settings.storeName}`,
    description: dictionary.checkout.subtitle,
    alternates: {
      canonical: `/${locale}/checkout`,
      languages: {
        uk: "/uk/checkout",
        ru: "/ru/checkout",
        "x-default": "/uk/checkout",
      },
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const config = await getStorefrontConfig();

  return (
    <CheckoutPage
      locale={localeParam}
      dictionary={getDictionary(localeParam)}
      products={config.products}
      deliveryPayment={config.deliveryPayment}
      coupons={config.coupons}
    />
  );
}
