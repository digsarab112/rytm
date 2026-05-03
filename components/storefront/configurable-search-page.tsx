"use client";

import { SearchPage } from "@/components/search/search-page";
import { useStorefrontConfig } from "@/components/storefront/storefront-config-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type ConfigurableSearchPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  query: string;
};

export function ConfigurableSearchPage({
  locale,
  dictionary,
  query,
}: ConfigurableSearchPageProps) {
  const config = useStorefrontConfig();
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const products = Array.isArray(config.products) ? config.products : [];
  const productReviews = Array.isArray(config.productReviews)
    ? config.productReviews
    : [];
  const attributeDefinitions = Array.isArray(config.attributeDefinitions)
    ? config.attributeDefinitions
    : [];

  return (
    <SearchPage
      locale={locale}
      dictionary={dictionary}
      settings={config.settings}
      initialQuery={query}
      products={products}
      categories={categories}
      productReviews={productReviews}
      attributeDefinitions={attributeDefinitions}
    />
  );
}
