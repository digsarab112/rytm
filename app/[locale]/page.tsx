import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigurableHomePage } from "@/components/storefront/configurable-home-page";
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

  return {
    title: config.settings.seo.title[locale],
    description: config.settings.seo.description[locale],
    alternates: {
      canonical: `/${locale}`,
      languages: {
        uk: "/uk",
        ru: "/ru",
        "x-default": "/uk",
      },
    },
    openGraph: {
      title: config.settings.seo.title[locale],
      description: config.settings.seo.description[locale],
      url: `/${locale}`,
      siteName: config.settings.storeName,
      locale: locale === "uk" ? "uk_UA" : "ru_UA",
      type: "website",
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return (
    <ConfigurableHomePage
      locale={locale}
      dictionary={getDictionary(locale)}
    />
  );
}
