import { ProductCarouselRail } from "@/components/home/product-carousel-rail";
import { SectionHeading } from "@/components/home/section-heading";
import { getCategoryAndDescendantIds } from "@/lib/catalog/category-tree";
import { isProductMerchandisable } from "@/lib/catalog/publication";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  HomepageSection,
  ProductPreview,
  ProductReview,
} from "@/types/store";

type ProductCarouselSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  section: HomepageSection;
  categories?: CategoryPreview[];
  products?: ProductPreview[];
  productReviews?: ProductReview[];
};

export function ProductCarouselSection({
  locale,
  dictionary,
  section,
  categories = [],
  products = [],
  productReviews = [],
}: ProductCarouselSectionProps) {
  const source = section.config?.productSource ?? section.variant ?? "bestSellers";
  const title =
    section.title?.[locale]?.trim() ||
    (source === "newArrivals"
      ? dictionary.homepage.newArrivals
      : dictionary.homepage.bestSellers);
  const limit = Math.max(1, Math.min(section.config?.limit ?? 8, 24));
  const publishedProducts = products.filter(isProductMerchandisable);
  const visibleProducts = getSectionProducts({
    categories,
    products: publishedProducts,
    section,
    source,
    limit,
  });

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-card py-14 md:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={title}
          actionHref={`/${locale}/catalog`}
          actionLabel={dictionary.actions.viewAll}
        />
        <ProductCarouselRail
          locale={locale}
          dictionary={dictionary}
          sectionId={section.id}
          products={visibleProducts}
          productReviews={productReviews}
        />
      </div>
    </section>
  );
}

function getSectionProducts({
  categories,
  products,
  section,
  source,
  limit,
}: {
  categories: CategoryPreview[];
  products: ProductPreview[];
  section: HomepageSection;
  source: NonNullable<HomepageSection["config"]>["productSource"] | HomepageSection["variant"];
  limit: number;
}) {
  if (source === "manual") {
    const ids = section.config?.productIds ?? [];
    const productMap = new Map(products.map((product) => [product.id, product]));

    return ids.flatMap((id) => {
      const product = productMap.get(id);
      return product ? [product] : [];
    }).slice(0, limit);
  }

  if (source === "category" && section.config?.categoryId) {
    const categoryIds = getCategoryAndDescendantIds(
      categories,
      section.config.categoryId,
    );

    return products
      .filter((product) => categoryIds.includes(product.categoryId))
      .slice(0, limit);
  }

  if (source === "newArrivals") {
    return [...products]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  }

  return [...products].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}
