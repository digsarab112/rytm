import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigurableCatalogPage } from "@/components/storefront/configurable-catalog-page";
import { parseCatalogFilters } from "@/lib/catalog/helpers";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
    title: `${dictionary.catalog.title} - ${config.settings.storeName}`,
    description: dictionary.catalog.subtitle,
    alternates: {
      canonical: `/${locale}/catalog`,
      languages: {
        uk: "/uk/catalog",
        ru: "/ru/catalog",
        "x-default": "/uk/catalog",
      },
    },
    openGraph: {
      title: `${dictionary.catalog.title} - ${config.settings.storeName}`,
      description: dictionary.catalog.subtitle,
      url: `/${locale}/catalog`,
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

  const locale: Locale = localeParam;
  const resolvedSearchParams = await searchParams;

  return (
    <ConfigurableCatalogPage
      locale={locale}
      dictionary={getDictionary(locale)}
      filters={parseCatalogFilters(resolvedSearchParams)}
    />
  );
}
