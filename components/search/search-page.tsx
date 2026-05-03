"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/home/product-card";
import { ProductVisual } from "@/components/home/product-visual";
import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  normalizeSearchQuery,
  searchProducts,
} from "@/lib/catalog/search";
import { isProductPublished } from "@/lib/catalog/publication";
import {
  formatPrice,
  getCategoryName,
  getProductDisplayPrice,
  getProductName,
} from "@/lib/catalog/helpers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductPreview,
  ProductReview,
  SiteSettings,
} from "@/types/store";

type SearchPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
  initialQuery: string;
  products?: ProductPreview[];
  categories?: CategoryPreview[];
  productReviews?: ProductReview[];
  attributeDefinitions?: ProductAttributeDefinition[];
};

const searchCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    placeholder: string;
    button: string;
    quickLinks: string;
    resultsTitle: string;
    resultsFor: string;
    productsFound: string;
    noQueryTitle: string;
    noQueryText: string;
    emptyTitle: string;
    emptyText: string;
    popularTitle: string;
    catalogLink: string;
  }
> = {
  uk: {
    eyebrow: "Пошук Rytm",
    title: "Знайдіть потрібний догляд",
    subtitle:
      "Шукайте за українською або російською назвою, брендом, SKU, категорією чи властивостями товару.",
    placeholder: "Назва, бренд, SKU або категорія",
    button: "Шукати",
    quickLinks: "Швидкі категорії",
    resultsTitle: "Результати пошуку",
    resultsFor: "за запитом",
    productsFound: "товарів",
    noQueryTitle: "Почніть з назви, бренду або категорії",
    noQueryText:
      "Пошук підкаже товари за назвою, артикулом, брендом, категорією, описом і характеристиками.",
    emptyTitle: "Нічого не знайдено",
    emptyText:
      "Спробуйте коротший запит, іншу назву бренду або перейдіть до каталогу.",
    popularTitle: "Популярні товари",
    catalogLink: "Відкрити каталог",
  },
  ru: {
    eyebrow: "Поиск Rytm",
    title: "Найдите нужный уход",
    subtitle:
      "Ищите по украинскому или русскому названию, бренду, SKU, категории или свойствам товара.",
    placeholder: "Название, бренд, SKU или категория",
    button: "Искать",
    quickLinks: "Быстрые категории",
    resultsTitle: "Результаты поиска",
    resultsFor: "по запросу",
    productsFound: "товаров",
    noQueryTitle: "Начните с названия, бренда или категории",
    noQueryText:
      "Поиск подберет товары по названию, артикулу, бренду, категории, описанию и характеристикам.",
    emptyTitle: "Ничего не найдено",
    emptyText:
      "Попробуйте более короткий запрос, другое название бренда или перейдите в каталог.",
    popularTitle: "Популярные товары",
    catalogLink: "Открыть каталог",
  },
};

export function SearchPage(props: SearchPageProps) {
  return <SearchPageContent key={props.initialQuery} {...props} />;
}

function SearchPageContent({
  locale,
  dictionary,
  settings,
  initialQuery,
  products = [],
  categories = [],
  productReviews = [],
  attributeDefinitions = [],
}: SearchPageProps) {
  const router = useRouter();
  const copy = searchCopy[locale];
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalizeSearchQuery(initialQuery);
  const liveNormalizedQuery = normalizeSearchQuery(query);
  const hasQuery = normalizedQuery.length > 0;
  const showLiveSuggestions =
    liveNormalizedQuery.length > 0 && liveNormalizedQuery !== normalizedQuery;
  const results = useMemo(
    () =>
      searchProducts({
        query: initialQuery,
        locale,
        products,
        categories,
        attributeDefinitions,
      }),
    [attributeDefinitions, categories, initialQuery, locale, products],
  );
  const liveSuggestions = useMemo(() => {
    if (!showLiveSuggestions) {
      return [];
    }

    return searchProducts({
      query,
      locale,
      products,
      categories,
      attributeDefinitions,
      limit: 5,
    });
  }, [
    attributeDefinitions,
    categories,
    locale,
    products,
    query,
    showLiveSuggestions,
  ]);
  const quickCategories = useMemo(
    () =>
      categories
        .filter((category) => category.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 6),
    [categories],
  );
  const popularProducts = useMemo(
    () =>
      products
        .filter((product) => isProductPublished(product))
        .sort(
          (a, b) =>
            b.popularity - a.popularity ||
            Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )
        .slice(0, 4),
    [products],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    router.push(
      trimmedQuery
        ? `/${locale}/search?q=${encodeURIComponent(trimmedQuery)}`
        : `/${locale}/search`,
    );
  }

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {copy.subtitle}
            </p>
            <form
              className="mt-7 flex flex-col gap-3 sm:flex-row"
              role="search"
              onSubmit={handleSubmit}
            >
              <div className="relative flex-1">
                <label htmlFor={`search-page-${locale}`} className="sr-only">
                  {copy.placeholder}
                </label>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`search-page-${locale}`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.placeholder}
                  className="h-12 bg-card pl-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="sm:min-w-36">
                <Search />
                {copy.button}
              </Button>
            </form>
            {showLiveSuggestions ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:max-w-2xl">
                {liveSuggestions.length > 0 ? (
                  <div className="grid">
                    {liveSuggestions.map((result) => (
                      <Link
                        key={result.product.id}
                        href={`/${locale}/products/${result.product.slug}`}
                        className="grid grid-cols-[58px_1fr] gap-3 border-b border-border px-3 py-3 last:border-b-0 hover:bg-muted"
                      >
                        <ProductVisual
                          tone={result.product.tone}
                          imageUrl={getPrimaryProductImage(result.product)}
                          alt={getProductName(result.product, locale)}
                          surface="thumbnail"
                          className="aspect-square rounded-md"
                        />
                        <span className="grid content-center gap-1">
                          <span className="line-clamp-2 text-sm font-bold text-foreground">
                            {getProductName(result.product, locale)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {result.product.brand}
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {formatPrice(getProductDisplayPrice(result.product))}{" "}
                            {dictionary.common.currency}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    {copy.emptyText}
                  </p>
                )}
              </div>
            ) : null}
            {quickCategories.length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {copy.quickLinks}
                </span>
                {quickCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/${locale}/search?q=${encodeURIComponent(
                      getCategoryName(category, locale),
                    )}`}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    {getCategoryName(category, locale)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <VisualMedia
            imageUrl={settings.visuals?.sectionImage}
            label={copy.title}
            tone="cream"
            className="aspect-[16/9] rounded-lg border border-white/60 shadow-sm"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {settings.storeName}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              {hasQuery ? copy.resultsTitle : copy.popularTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasQuery
                ? `${results.length} ${copy.productsFound} ${copy.resultsFor} "${initialQuery}"`
                : copy.noQueryText}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/${locale}/catalog`}>{copy.catalogLink}</Link>
          </Button>
        </div>

        {hasQuery ? (
          results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((result) => (
                <ProductCard
                  key={result.product.id}
                  locale={locale}
                  dictionary={dictionary}
                  product={result.product}
                  reviews={productReviews}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-xl font-bold text-foreground">
                {copy.emptyTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {copy.emptyText}
              </p>
            </div>
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularProducts.length > 0 ? (
              popularProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={locale}
                  dictionary={dictionary}
                  product={product}
                  reviews={productReviews}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center sm:col-span-2 lg:col-span-4">
                <h3 className="text-xl font-bold text-foreground">
                  {copy.noQueryTitle}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  {copy.noQueryText}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
