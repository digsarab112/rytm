"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/home/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview, ProductReview } from "@/types/store";

type ProductCarouselRailProps = {
  locale: Locale;
  dictionary: Dictionary;
  sectionId: string;
  products: ProductPreview[];
  productReviews?: ProductReview[];
};

export function ProductCarouselRail({
  locale,
  dictionary,
  sectionId,
  products,
  productReviews = [],
}: ProductCarouselRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  function revealControls(sticky = false) {
    setControlsVisible(true);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    if (!sticky) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 1800);
    }
  }

  function hideControls() {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    setControlsVisible(false);
  }

  function scrollRail(direction: "previous" | "next") {
    revealControls();
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    rail.scrollBy({
      left: direction === "next" ? rail.clientWidth : -rail.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div
      className="relative"
      onPointerEnter={() => revealControls(true)}
      onPointerLeave={hideControls}
      onTouchStart={() => revealControls()}
      onFocusCapture={() => revealControls(true)}
      onBlurCapture={() => revealControls()}
    >
      <div
        ref={railRef}
        className="homepage-product-rail -mx-4 pb-4 sm:-mx-6 lg:mx-0 lg:pb-0"
      >
        {products.map((product) => (
          <div
            key={`${sectionId}-${product.id}`}
            className="homepage-product-rail-item snap-start"
          >
            <ProductCard
              locale={locale}
              dictionary={dictionary}
              product={product}
              reviews={productReviews}
              presentation="compactRail"
            />
          </div>
        ))}
      </div>
      {products.length > 2 ? (
        <>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={locale === "uk" ? "Попередні товари" : "Предыдущие товары"}
            onClick={() => scrollRail("previous")}
            className={cn(
              "absolute left-2 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full bg-card/95 shadow-lg transition-opacity lg:hidden",
              controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={locale === "uk" ? "Наступні товари" : "Следующие товары"}
            onClick={() => scrollRail("next")}
            className={cn(
              "absolute right-2 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full bg-card/95 shadow-lg transition-opacity lg:hidden",
              controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <ChevronRight className="size-4" />
          </Button>
        </>
      ) : null}
    </div>
  );
}
