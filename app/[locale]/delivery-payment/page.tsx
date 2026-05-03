import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigurableInfoPage } from "@/components/storefront/configurable-info-page";
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
  const config = await getStorefrontConfig();
  const title = locale === "uk" ? "Доставка та оплата" : "Доставка и оплата";

  return {
    title: `${title} - ${config.settings.storeName}`,
    description:
      locale === "uk"
        ? "Способи доставки й оплати для замовлень Rytm по Україні."
        : "Способы доставки и оплаты для заказов Rytm по Украине.",
  };
}

export default async function Page({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return (
    <ConfigurableInfoPage
      locale={localeParam}
      dictionary={getDictionary(localeParam)}
      kind="delivery-payment"
    />
  );
}
