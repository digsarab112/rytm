import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ConfigurableInfoPage,
  type PublicInfoPageKind,
} from "@/components/storefront/configurable-info-page";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const pageTitles: Record<PublicInfoPageKind, Record<Locale, string>> = {
  "delivery-payment": {
    uk: "Доставка та оплата",
    ru: "Доставка и оплата",
  },
  contact: {
    uk: "Контакти",
    ru: "Контакты",
  },
  "privacy-policy": {
    uk: "Політика конфіденційності",
    ru: "Политика конфиденциальности",
  },
  terms: {
    uk: "Умови користування",
    ru: "Условия использования",
  },
  "return-policy": {
    uk: "Повернення",
    ru: "Возврат",
  },
};

export function createPublicInfoPage(kind: PublicInfoPageKind) {
  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale: localeParam } = await params;

    if (!isLocale(localeParam)) {
      return {};
    }

    const locale: Locale = localeParam;
    const config = await getStorefrontConfig();

    return {
      title: `${pageTitles[kind][locale]} - ${config.settings.storeName}`,
      description: config.settings.description[locale],
    };
  }

  async function Page({ params }: PageProps) {
    const { locale: localeParam } = await params;

    if (!isLocale(localeParam)) {
      notFound();
    }

    return (
      <ConfigurableInfoPage
        locale={localeParam}
        dictionary={getDictionary(localeParam)}
        kind={kind}
      />
    );
  }

  return { generateMetadata, default: Page };
}
