import { ProductCard } from "@/components/home/product-card";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview, ProductReview } from "@/types/store";

type CatalogProductGridProps = {
  locale: Locale;
  dictionary: Dictionary;
  products?: ProductPreview[];
  reviews?: ProductReview[];
};

export function CatalogProductGrid({
  locale,
  dictionary,
  products = [],
  reviews = [],
}: CatalogProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <h2 className="text-xl font-bold text-foreground">
          {dictionary.catalog.noResults}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {dictionary.catalog.resetFilters}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 self-start items-stretch gap-3 sm:gap-4 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          locale={locale}
          dictionary={dictionary}
          product={product}
          reviews={reviews}
        />
      ))}
    </div>
  );
}
