"use client";

import { HomePage } from "@/components/home/homepage";
import { useStorefrontConfig } from "@/components/storefront/storefront-config-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type ConfigurableHomePageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function ConfigurableHomePage({
  locale,
  dictionary,
}: ConfigurableHomePageProps) {
  const config = useStorefrontConfig();
  const sections = Array.isArray(config.homepageSections)
    ? config.homepageSections
    : [];
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const products = Array.isArray(config.products) ? config.products : [];
  const productReviews = Array.isArray(config.productReviews)
    ? config.productReviews
    : [];
  const benefits = Array.isArray(config.benefits) ? config.benefits : [];
  const reviews = Array.isArray(config.reviews) ? config.reviews : [];
  const deliveryInfo = Array.isArray(config.deliveryInfo)
    ? config.deliveryInfo
    : [];

  return (
    <HomePage
      locale={locale}
      dictionary={dictionary}
      settings={config.settings}
      sections={sections}
      categories={categories}
      products={products}
      productReviews={productReviews}
      benefits={benefits}
      reviews={reviews}
      deliveryInfo={deliveryInfo}
    />
  );
}
