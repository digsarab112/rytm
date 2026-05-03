import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigurableProductPage } from "@/components/storefront/configurable-product-page";
import {
  getProductSeoKeywords,
  getProductSeoMetaDescription,
  getProductSeoTitle,
} from "@/lib/catalog/helpers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import { isProductPublished } from "@/lib/catalog/publication";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDefaultStorefrontConfig } from "@/lib/platform/storefront-config";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const config = getDefaultStorefrontConfig();

  return locales.flatMap((locale) =>
    config.products
      .filter((product) => isProductPublished(product))
      .map((product) => ({ locale, slug: product.slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const locale: Locale = localeParam;
  const config = await getStorefrontConfig();
  const product = config.products.find((item) => item.slug === slug);

  if (!product) {
    return {};
  }

  const title = getProductSeoTitle(product, locale);
  const description = getProductSeoMetaDescription(product, locale);
  const productImage = getPrimaryProductImage(product);

  return {
    title,
    description,
    keywords: getProductSeoKeywords(product, locale),
    alternates: {
      canonical: `/${locale}/products/${product.slug}`,
      languages: {
        uk: `/uk/products/${product.slug}`,
        ru: `/ru/products/${product.slug}`,
        "x-default": `/uk/products/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/products/${product.slug}`,
      siteName: config.settings.storeName,
      locale: locale === "uk" ? "uk_UA" : "ru_UA",
      type: "website",
      images: productImage
        ? [
            {
              url: productImage,
              alt: title,
            },
          ]
        : undefined,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const config = await getStorefrontConfig();
  const product = config.products.find((item) => item.slug === slug);

  if (!product || !isProductPublished(product)) {
    notFound();
  }

  return (
    <ConfigurableProductPage
      locale={localeParam}
      dictionary={getDictionary(localeParam)}
      slug={slug}
      fallbackProduct={product}
    />
  );
}
