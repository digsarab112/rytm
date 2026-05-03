"use client";

import Link from "next/link";
import { type FocusEvent, type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { ProductVisual } from "@/components/home/product-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  normalizeSearchQuery,
  searchProducts,
} from "@/lib/catalog/search";
import {
  formatPrice,
  getProductDisplayPrice,
  getProductName,
} from "@/lib/catalog/helpers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import { isProductPublished } from "@/lib/catalog/publication";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductPreview,
} from "@/types/store";

type HeaderSearchProps = {
  locale: Locale;
  label: string;
  products?: ProductPreview[];
  categories?: CategoryPreview[];
  attributeDefinitions?: ProductAttributeDefinition[];
};

const searchCopy: Record<
  Locale,
  {
    placeholder: string;
    suggestions: string;
    viewAll: string;
    startTitle: string;
    startText: string;
    emptyText: string;
    currency: string;
  }
> = {
  uk: {
    placeholder: "Пошук товарів",
    suggestions: "Підказки",
    viewAll: "Усі результати",
    startTitle: "Що шукаєте?",
    startText: "Почніть вводити назву, бренд або категорію.",
    emptyText: "Нічого не знайдено. Спробуйте коротший запит.",
    currency: "грн",
  },
  ru: {
    placeholder: "Поиск товаров",
    suggestions: "Подсказки",
    viewAll: "Все результаты",
    startTitle: "Что ищете?",
    startText: "Начните вводить название, бренд или категорию.",
    emptyText: "Ничего не найдено. Попробуйте более короткий запрос.",
    currency: "грн",
  },
};

export function HeaderSearch({
  locale,
  label,
  products = [],
  categories = [],
  attributeDefinitions = [],
}: HeaderSearchProps) {
  const router = useRouter();
  const copy = searchCopy[locale];
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchHref = getSearchHref(locale, query);
  const hasQuery = normalizeSearchQuery(query).length > 0;
  const suggestions = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return searchProducts({
      query,
      locale,
      products,
      categories,
      attributeDefinitions,
      limit: 4,
    });
  }, [attributeDefinitions, categories, hasQuery, locale, products, query]);
  const mobileSuggestions = useMemo(() => {
    if (!hasQuery) {
      return [];
    }

    return searchProducts({
      query,
      locale,
      products,
      categories,
      attributeDefinitions,
      limit: 6,
    });
  }, [attributeDefinitions, categories, hasQuery, locale, products, query]);
  const popularProducts = useMemo(
    () =>
      products
        .filter((product) => isProductPublished(product))
        .sort(
          (a, b) =>
            b.popularity - a.popularity ||
            Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )
        .slice(0, 5),
    [products],
  );
  const showSuggestions = isOpen && hasQuery;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    router.push(searchHref);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsOpen(false);
  }

  return (
    <>
      <div
        className="relative hidden xl:block"
        onBlur={handleBlur}
        onFocus={() => setIsOpen(true)}
      >
        <form
          className="relative w-[min(28vw,320px)]"
          role="search"
          onSubmit={handleSubmit}
        >
          <label htmlFor={`header-search-${locale}`} className="sr-only">
            {label}
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`header-search-${locale}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
            className="h-10 border-border bg-card pl-9 pr-12 text-sm shadow-none"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label={label}
            className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
          >
            <Search />
          </Button>
        </form>
        {showSuggestions ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {copy.suggestions}
            </p>
            {suggestions.length > 0 ? (
              <div className="grid">
                {suggestions.map((result) => (
                  <Link
                    key={result.product.id}
                    href={`/${locale}/products/${result.product.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="grid grid-cols-[72px_1fr] gap-3 px-4 py-3 text-sm hover:bg-muted"
                  >
                    <ProductVisual
                      tone={result.product.tone}
                      imageUrl={getPrimaryProductImage(result.product)}
                      alt={getProductName(result.product, locale)}
                      surface="thumbnail"
                      className="aspect-square rounded-md"
                    />
                    <span className="grid min-w-0 content-center gap-1">
                      <span className="line-clamp-2 font-semibold leading-5 text-foreground">
                        {getProductName(result.product, locale)}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {result.product.brand} ·{" "}
                        {formatPrice(getProductDisplayPrice(result.product))}{" "}
                        {copy.currency}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-4 py-4 text-sm leading-6 text-muted-foreground">
                {copy.emptyText}
              </p>
            )}
            <Link
              href={searchHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-muted"
            >
              <span>{copy.viewAll}</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 xl:hidden"
        type="button"
        onClick={() => setIsMobileSearchOpen(true)}
        aria-label={label}
      >
        <Search />
      </Button>
      <Sheet open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
        <SheetContent
          side="right"
          className="inset-y-0 right-0 h-dvh w-full max-w-none border-l p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border px-4 py-4">
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <div className="grid gap-5 px-4 pb-6 pt-4">
            <form className="relative" role="search" onSubmit={handleSubmit}>
              <label htmlFor={`mobile-search-${locale}`} className="sr-only">
                {label}
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`mobile-search-${locale}`}
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.placeholder}
                className="h-12 bg-background pl-12 pr-12 text-base"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={label}
                className="absolute right-1 top-1/2 size-10 -translate-y-1/2"
              >
                <Search />
              </Button>
            </form>
            <MobileSearchResults
              locale={locale}
              copy={copy}
              query={query}
              searchHref={searchHref}
              products={
                hasQuery
                  ? mobileSuggestions.map((result) => result.product)
                  : popularProducts
              }
              hasQuery={hasQuery}
              onNavigate={() => setIsMobileSearchOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function getSearchHref(locale: Locale, query: string) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return `/${locale}/search`;
  }

  return `/${locale}/search?q=${encodeURIComponent(trimmedQuery)}`;
}

function MobileSearchResults({
  locale,
  copy,
  query,
  searchHref,
  products,
  hasQuery,
  onNavigate,
}: {
  locale: Locale;
  copy: (typeof searchCopy)[Locale];
  query: string;
  searchHref: string;
  products: ProductPreview[];
  hasQuery: boolean;
  onNavigate: () => void;
}) {
  if (hasQuery && products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        {copy.emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            {hasQuery ? copy.suggestions : copy.startTitle}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {hasQuery ? `"${query.trim()}"` : copy.startText}
          </p>
        </div>
        {hasQuery ? (
          <Link
            href={searchHref}
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary"
          >
            {copy.viewAll}
            <ArrowRight className="size-3" />
          </Link>
        ) : null}
      </div>
      <div className="grid gap-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${locale}/products/${product.slug}`}
            onClick={onNavigate}
            className="grid grid-cols-[68px_1fr] gap-3 rounded-lg border border-border bg-card p-2 shadow-sm"
          >
            <ProductVisual
              tone={product.tone}
              imageUrl={getPrimaryProductImage(product)}
              alt={getProductName(product, locale)}
              surface="thumbnail"
              className="aspect-square rounded-md"
            />
            <span className="grid content-center gap-1">
              <span className="line-clamp-2 text-sm font-bold leading-5 text-foreground">
                {getProductName(product, locale)}
              </span>
              <span className="text-xs text-muted-foreground">
                {product.brand}
              </span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(getProductDisplayPrice(product))} {copy.currency}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
