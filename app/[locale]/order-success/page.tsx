import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderSuccessPage } from "@/components/checkout/order-success-page";
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
    title: `${dictionary.order.successTitle} - ${config.settings.storeName}`,
    description: dictionary.order.successText,
    alternates: {
      canonical: `/${locale}/order-success`,
      languages: {
        uk: "/uk/order-success",
        ru: "/ru/order-success",
        "x-default": "/uk/order-success",
      },
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <OrderSuccessPage
        locale={localeParam}
        dictionary={getDictionary(localeParam)}
      />
    </Suspense>
  );
}
