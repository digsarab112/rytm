"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { ProductVisual } from "@/components/home/product-visual";
import { getProductName } from "@/lib/catalog/helpers";
import {
  normalizeProductImageUrl,
  normalizeProductImageUrls,
} from "@/lib/catalog/product-images";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview } from "@/types/store";

type ProductGalleryProps = {
  product: ProductPreview;
  locale: Locale;
  focusImage?: string;
};

export function ProductGallery({
  product,
  locale,
  focusImage,
}: ProductGalleryProps) {
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const baseImages = useMemo(
    () => normalizeProductImageUrls(product.images ?? []),
    [product.images],
  );
  const variantImages = useMemo(
    () =>
      normalizeProductImageUrls(
        (product.variants ?? [])
          .map((variant) => variant.image)
          .filter((image): image is string => Boolean(image)),
      ),
    [product.variants],
  );
  const focusedImage = useMemo(
    () => (focusImage ? normalizeProductImageUrl(focusImage) : undefined),
    [focusImage],
  );
  const images = useMemo(() => {
    const seen = new Set<string>();

    return [focusedImage, ...baseImages, ...variantImages]
      .filter((image): image is string => Boolean(image))
      .filter((image) => {
        if (seen.has(image)) {
          return false;
        }

        seen.add(image);
        return true;
      });
  }, [baseImages, focusedImage, variantImages]);
  const productName = getProductName(product, locale);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    images[0],
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeImage =
    selectedImage && images.includes(selectedImage) ? selectedImage : images[0];
  const activeIndex = Math.max(
    0,
    images.findIndex((image) => image === activeImage),
  );
  const canNavigateImages = images.length > 1;
  const showThumbnails = images.length > 1;
  const showThumbnailControls = images.length > 4;

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (event.key === "ArrowLeft") {
        selectPreviousImage();
      }

      if (event.key === "ArrowRight") {
        selectNextImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function selectImageByOffset(offset: number) {
    if (images.length === 0) {
      return;
    }

    const nextIndex = (activeIndex + offset + images.length) % images.length;
    setSelectedImage(images[nextIndex]);
  }

  function selectPreviousImage() {
    selectImageByOffset(-1);
  }

  function selectNextImage() {
    selectImageByOffset(1);
  }

  function scrollThumbnails(direction: "previous" | "next") {
    thumbnailRailRef.current?.scrollBy({
      left: direction === "next" ? 260 : -260,
      behavior: "smooth",
    });
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => setIsLightboxOpen(Boolean(activeImage))}
        className="group relative overflow-hidden rounded-lg text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={
          locale === "uk"
            ? `Збільшити фото ${productName}`
            : `Увеличить фото ${productName}`
        }
      >
        <ProductVisual
          tone={product.tone}
          imageUrl={activeImage}
          alt={productName}
          surface="detail"
          className="aspect-[4/5] min-h-[20rem] md:aspect-square lg:min-h-[34rem]"
        />
        {activeImage ? (
          <span className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur">
            <Expand className="size-4" />
          </span>
        ) : null}
      </button>
      {showThumbnails ? (
        <div className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-card/80 p-2 shadow-sm">
          {showThumbnailControls ? (
            <button
              type="button"
              onClick={() => scrollThumbnails("previous")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:border-primary"
              aria-label={locale === "uk" ? "Попередні фото" : "Предыдущие фото"}
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : null}
          <div
            ref={thumbnailRailRef}
            className="no-scrollbar flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto scroll-smooth"
          >
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`size-16 shrink-0 snap-start overflow-hidden rounded-lg border bg-white p-1 shadow-sm transition-colors sm:size-20 ${
                  image === activeImage
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
                aria-current={image === activeImage}
                aria-label={`${productName} image ${index + 1}`}
              >
                <ProductVisual
                  tone={product.tone}
                  imageUrl={image}
                  alt={`${productName} ${index + 1}`}
                  surface="thumbnail"
                  className="h-full w-full aspect-square opacity-95"
                />
              </button>
            ))}
          </div>
          {showThumbnailControls ? (
            <button
              type="button"
              onClick={() => scrollThumbnails("next")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:border-primary"
              aria-label={locale === "uk" ? "Наступні фото" : "Следующие фото"}
            >
              <ChevronRight className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {isLightboxOpen && activeImage ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={productName}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative grid w-full max-w-5xl gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-0 top-0 z-10 inline-flex size-11 -translate-y-14 items-center justify-center rounded-full bg-card text-foreground shadow-sm"
              aria-label={locale === "uk" ? "Закрити фото" : "Закрыть фото"}
            >
              <X className="size-5" />
            </button>
            <div className="relative overflow-hidden rounded-lg bg-card shadow-xl">
              <ProductVisual
                tone={product.tone}
                imageUrl={activeImage}
                alt={productName}
                surface="lightbox"
                className="max-h-[78vh] min-h-[60vh]"
              />
              {canNavigateImages ? (
                <>
                  <button
                    type="button"
                    onClick={selectPreviousImage}
                    className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm"
                    aria-label={
                      locale === "uk" ? "Попереднє фото" : "Предыдущее фото"
                    }
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={selectNextImage}
                    className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm"
                    aria-label={locale === "uk" ? "Наступне фото" : "Следующее фото"}
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              ) : null}
            </div>
            {canNavigateImages ? (
              <div className="no-scrollbar mx-auto flex max-w-full gap-2 overflow-x-auto rounded-full bg-card/90 p-2 shadow-sm">
                {images.map((image, index) => (
                  <button
                    key={`lightbox-${image}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`size-14 shrink-0 overflow-hidden rounded-full border p-1 ${
                      image === activeImage ? "border-primary" : "border-border"
                    }`}
                    aria-label={`${productName} image ${index + 1}`}
                  >
                    <ProductVisual
                      tone={product.tone}
                      imageUrl={image}
                      alt=""
                      surface="thumbnail"
                      className="aspect-square rounded-full"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
