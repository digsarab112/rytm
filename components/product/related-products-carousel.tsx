"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/home/product-card";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview, ProductReview } from "@/types/store";

type RelatedProductsCarouselProps = {
  locale: Locale;
  dictionary: Dictionary;
  title: string;
  products: ProductPreview[];
  reviews?: ProductReview[];
};

const PRODUCTS_PER_DESKTOP_PAGE = 4;
const MAX_MOVES = 8;
const MAX_PRODUCTS = PRODUCTS_PER_DESKTOP_PAGE * (MAX_MOVES + 1);

export function RelatedProductsCarousel({
  locale,
  dictionary,
  title,
  products,
  reviews = [],
}: RelatedProductsCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const visibleProducts = useMemo(
    () => products.slice(0, MAX_PRODUCTS),
    [products],
  );
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const showControls = visibleProducts.length > 2;

  function move(direction: "previous" | "next") {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    rail.scrollBy({
      left: direction === "next" ? rail.clientWidth : -rail.clientWidth,
      behavior: "smooth",
    });
  }

  function syncScrollState() {
    const rail = railRef.current;

    if (!rail || rail.clientWidth <= 0) {
      setCanScrollPrevious(false);
      setCanScrollNext(false);
      return;
    }

    setCanScrollPrevious(rail.scrollLeft > 2);
    setCanScrollNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }

  useEffect(() => {
    syncScrollState();
    window.addEventListener("resize", syncScrollState);

    return () => window.removeEventListener("resize", syncScrollState);
  }, [visibleProducts.length]);

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-card py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {showControls ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => move("previous")}
                disabled={!canScrollPrevious}
                aria-label={
                  locale === "uk" ? "Попередні товари" : "Предыдущие товары"
                }
              >
                <ArrowLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => move("next")}
                disabled={!canScrollNext}
                aria-label={
                  locale === "uk" ? "Наступні товари" : "Следующие товары"
                }
              >
                <ArrowRight />
              </Button>
            </div>
          ) : null}
        </div>
        <div
          ref={railRef}
          onScroll={syncScrollState}
          className="related-products-rail mt-6 scroll-smooth"
        >
          {visibleProducts.map((product) => (
            <div
              key={product.id}
              className="related-products-rail-item snap-start"
            >
              <ProductCard
                locale={locale}
                dictionary={dictionary}
                product={product}
                reviews={reviews}
                presentation="compactRail"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
