"use client";

import Link from "next/link";

import { ProductPage } from "@/components/product/product-page";
import { useStorefrontConfig } from "@/components/storefront/storefront-config-provider";
import { Button } from "@/components/ui/button";
import { getRelatedProducts, getSameBrandProducts } from "@/lib/catalog/helpers";
import { isProductPublished } from "@/lib/catalog/publication";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview } from "@/types/store";

type ConfigurableProductPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  slug: string;
  fallbackProduct: ProductPreview;
};

export function ConfigurableProductPage({
  locale,
  dictionary,
  slug,
  fallbackProduct,
}: ConfigurableProductPageProps) {
  const config = useStorefrontConfig();
  const products = Array.isArray(config.products) ? config.products : [];
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const attributeDefinitions = Array.isArray(config.attributeDefinitions)
    ? config.attributeDefinitions
    : [];
  const productReviews = Array.isArray(config.productReviews)
    ? config.productReviews
    : [];
  const product = products.find((item) => item.slug === slug) ?? fallbackProduct;

  if (!isProductPublished(product)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">
          {dictionary.catalog.noResults}
        </h1>
        <Button asChild className="mt-6">
          <Link href={`/${locale}/catalog`}>{dictionary.navigation.catalog}</Link>
        </Button>
      </div>
    );
  }

  return (
    <ProductPage
      locale={locale}
      dictionary={dictionary}
      product={product}
      categories={categories}
      attributeDefinitions={attributeDefinitions}
      relatedProducts={getRelatedProducts(product, products, categories, productReviews)}
      sameBrandProducts={getSameBrandProducts(
        product,
        products,
        categories,
        productReviews,
      )}
      allProducts={products}
      productReviews={productReviews}
    />
  );
}
