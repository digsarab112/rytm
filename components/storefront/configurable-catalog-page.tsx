"use client";

import { CatalogPage } from "@/components/catalog/catalog-page";
import { useStorefrontConfig } from "@/components/storefront/storefront-config-provider";
import type { CatalogFilters } from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type ConfigurableCatalogPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  filters: CatalogFilters;
};

export function ConfigurableCatalogPage({
  locale,
  dictionary,
  filters,
}: ConfigurableCatalogPageProps) {
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
    <CatalogPage
      locale={locale}
      dictionary={dictionary}
      settings={config.settings}
      categories={categories}
      products={products}
      productReviews={productReviews}
      attributeDefinitions={attributeDefinitions}
      filters={filters}
    />
  );
}
