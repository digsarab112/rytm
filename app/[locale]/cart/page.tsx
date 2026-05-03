import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CartPage } from "@/components/cart/cart-page";
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
    title: `${dictionary.cart.title} - ${config.settings.storeName}`,
    description: dictionary.cart.subtitle,
    alternates: {
      canonical: `/${locale}/cart`,
      languages: {
        uk: "/uk/cart",
        ru: "/ru/cart",
        "x-default": "/uk/cart",
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
    <CartPage
      locale={localeParam}
      dictionary={getDictionary(localeParam)}
      products={config.products}
      deliveryPayment={config.deliveryPayment}
    />
  );
}
