import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigurableSearchPage } from "@/components/storefront/configurable-search-page";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const locale: Locale = localeParam;
  const config = await getStorefrontConfig();
  const title = locale === "uk" ? "Пошук товарів" : "Поиск товаров";
  const description =
    locale === "uk"
      ? "Пошук косметики та wellness товарів Rytm за назвою, брендом, SKU, категорією та характеристиками."
      : "Поиск косметики и wellness товаров Rytm по названию, бренду, SKU, категории и характеристикам.";

  return {
    title: `${title} - ${config.settings.storeName}`,
    description,
    alternates: {
      canonical: `/${locale}/search`,
      languages: {
        uk: "/uk/search",
        ru: "/ru/search",
        "x-default": "/uk/search",
      },
    },
    openGraph: {
      title: `${title} - ${config.settings.storeName}`,
      description,
      url: `/${locale}/search`,
      siteName: config.settings.storeName,
      locale: locale === "uk" ? "uk_UA" : "ru_UA",
      type: "website",
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const query = getSingleParam(resolvedSearchParams.q)?.trim() ?? "";

  return (
    <ConfigurableSearchPage
      locale={localeParam}
      dictionary={getDictionary(localeParam)}
      query={query}
    />
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
