import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ConfigurablePublicShell } from "@/components/storefront/configurable-public-shell";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";
import type { StorefrontConfig } from "@/types/platform";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  await connection();
  const config = await getStorefrontConfig();

  return (
    <ConfigurablePublicShell
      locale={locale}
      dictionary={dictionary}
      initialConfig={getPublicClientConfig(config)}
    >
      {children}
    </ConfigurablePublicShell>
  );
}

function getPublicClientConfig(config: StorefrontConfig): StorefrontConfig {
  return {
    ...config,
    suppliers: [],
    coupons: [],
    orders: [],
    customers: [],
  };
}
