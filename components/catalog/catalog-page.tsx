import Link from "next/link";

import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters";
import { CatalogProductGrid } from "@/components/catalog/catalog-product-grid";
import { VisualMedia } from "@/components/home/visual-media";
import {
  filterProducts,
  getAttributeFilterOptions,
  getBrands,
  getCategoryDescription,
  getCategoryName,
  type CatalogFilters,
} from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductPreview,
  ProductReview,
  SiteSettings,
} from "@/types/store";

const catalogPageSize = 12;

type CatalogPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
  categories?: CategoryPreview[];
  products?: ProductPreview[];
  productReviews?: ProductReview[];
  attributeDefinitions?: ProductAttributeDefinition[];
  filters: CatalogFilters;
};

export function CatalogPage({
  locale,
  dictionary,
  settings,
  categories = [],
  products = [],
  productReviews = [],
  attributeDefinitions = [],
  filters,
}: CatalogPageProps) {
  const selectedCategory = filters.category
    ? categories.find((category) => category.slug === filters.category)
    : undefined;
  const headerTitle = selectedCategory
    ? getCategoryName(selectedCategory, locale)
    : dictionary.catalog.title;
  const headerDescription = selectedCategory
    ? getCategoryDescription(selectedCategory, locale)
    : dictionary.catalog.subtitle;
  const visibleProducts = filterProducts(
    products,
    categories,
    filters,
    locale,
    attributeDefinitions,
    productReviews,
  );
  const filterOptionProducts = filterProducts(
    products,
    categories,
    getFacetSourceFilters(filters),
    locale,
    attributeDefinitions,
    productReviews,
  );
  const brands = getBrands(filterOptionProducts);
  const attributeFilters = getAttributeFilterOptions(
    filterOptionProducts,
    attributeDefinitions,
    locale,
  );
  const filterContext = selectedCategory
    ? locale === "uk"
      ? `Опції підібрані для розділу «${headerTitle}».`
      : `Опции подобраны для раздела «${headerTitle}».`
    : locale === "uk"
      ? "Опції оновлюються за поточним пошуком і товарами в каталозі."
      : "Опции обновляются по текущему поиску и товарам в каталоге.";
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / catalogPageSize));
  const currentPage = Math.min(Math.max(filters.page, 1), totalPages);
  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * catalogPageSize,
    currentPage * catalogPageSize,
  );

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {settings.storeName}
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-bold leading-tight text-foreground">
                  {headerTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  {headerDescription}
                </p>
              </div>
              <p className="w-fit rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
                {visibleProducts.length} {dictionary.catalog.productsFound}
              </p>
            </div>
          </div>
          <VisualMedia
            imageUrl={selectedCategory?.image ?? settings.visuals?.sectionImage}
            label={headerTitle}
            tone={selectedCategory?.tone ?? "cream"}
            className="aspect-[16/9] rounded-lg border border-white/60 shadow-sm"
          />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <CatalogFiltersPanel
          locale={locale}
          dictionary={dictionary}
          categories={categories}
          brands={brands}
          attributeFilters={attributeFilters}
          filters={filters}
          filterContext={filterContext}
        />
        <div className="grid gap-6">
          <CatalogProductGrid
            locale={locale}
            dictionary={dictionary}
            products={paginatedProducts}
            reviews={productReviews}
          />
          <CatalogPagination
            locale={locale}
            filters={filters}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </section>
    </div>
  );
}

function getFacetSourceFilters(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    brand: undefined,
    attributes: {},
    availability: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    saleOnly: false,
    minRating: undefined,
    sort: "newest",
    page: 1,
  };
}

function CatalogPagination({
  locale,
  filters,
  currentPage,
  totalPages,
}: {
  locale: Locale;
  filters: CatalogFilters;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Catalog pagination"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={buildCatalogPageHref(locale, filters, currentPage - 1)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm hover:bg-muted"
        >
          {locale === "uk" ? "Назад" : "Назад"}
        </Link>
      ) : null}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildCatalogPageHref(locale, filters, page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`inline-flex size-10 items-center justify-center rounded-full border text-sm font-bold shadow-sm ${
            page === currentPage
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages ? (
        <Link
          href={buildCatalogPageHref(locale, filters, currentPage + 1)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm hover:bg-muted"
        >
          {locale === "uk" ? "Далі" : "Далее"}
        </Link>
      ) : null}
    </nav>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function buildCatalogPageHref(
  locale: Locale,
  filters: CatalogFilters,
  page: number,
) {
  const params = new URLSearchParams();

  setParam(params, "q", filters.q);
  setParam(params, "category", filters.category);
  setParam(params, "brand", filters.brand);
  setParam(params, "availability", filters.availability);
  setParam(params, "minPrice", filters.minPrice);
  setParam(params, "maxPrice", filters.maxPrice);
  setParam(params, "minRating", filters.minRating);

  if (filters.saleOnly) {
    params.set("sale", "1");
  }

  if (filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  Object.entries(filters.attributes ?? {}).forEach(([slug, value]) => {
    setParam(params, `attr_${slug}`, value);
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return `/${locale}/catalog${query ? `?${query}` : ""}`;
}

function setParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  const normalized = String(value ?? "").trim();

  if (normalized) {
    params.set(key, normalized);
  }
}
