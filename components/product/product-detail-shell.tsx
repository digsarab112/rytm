"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, Truck } from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { SaveProductButton } from "@/components/customer/save-product-button";
import { ProductGallery } from "@/components/product/product-gallery";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  getActiveProductVariants,
  getDefaultProductVariant,
  getProductBadge,
  getProductDisplayPrice,
  getProductName,
  getProductSalePrice,
  getProductShortDescription,
  getVariantDisplayPrice,
  getVariantName,
  getVariantOptionName,
  getVariantSalePrice,
} from "@/lib/catalog/helpers";
import { getProductReviewSummary } from "@/lib/catalog/reviews";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  ProductPreview,
  ProductReview,
} from "@/types/store";

type ProductDetailShellProps = {
  locale: Locale;
  dictionary: Dictionary;
  product: ProductPreview;
  categoryName: string;
  productReviews: ProductReview[];
};

export function ProductDetailShell({
  locale,
  dictionary,
  product,
  categoryName,
  productReviews,
}: ProductDetailShellProps) {
  const variants = useMemo(() => getActiveProductVariants(product), [product]);
  const defaultVariant = useMemo(
    () => getDefaultProductVariant(product),
    [product],
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant;
  const displayPrice = selectedVariant
    ? getVariantDisplayPrice(selectedVariant)
    : getProductDisplayPrice(product);
  const salePrice = selectedVariant
    ? getVariantSalePrice(selectedVariant)
    : getProductSalePrice(product);
  const regularPrice = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;
  const sku = selectedVariant?.sku || product.sku;
  const badge =
    getProductBadge(product, locale)?.trim() ||
    (salePrice ? dictionary.common.sale : undefined);
  const isAvailable = product.status === "active" && stock > 0;
  const reviewSummary = getProductReviewSummary(productReviews, product.id);
  const variantOptionName = selectedVariant
    ? getVariantOptionName(selectedVariant, locale)
    : locale === "uk"
      ? "Варіант"
      : "Вариант";

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <ProductGallery
        key={selectedVariant?.id ?? "base-product-gallery"}
        product={product}
        locale={locale}
        focusImage={selectedVariant?.image}
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {badge ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {badge}
            </span>
          ) : null}
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            {categoryName || dictionary.product.category}
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-bold leading-tight text-foreground lg:text-5xl">
          {getProductName(product, locale)}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          {getProductShortDescription(product, locale)}
        </p>
        <div className="mt-5 flex w-fit max-w-full flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap text-sm font-semibold text-muted-foreground">
          {reviewSummary.reviewCount > 0 ? (
            <>
              <StarRating rating={reviewSummary.averageRating} />
              <span className="whitespace-nowrap">
                {reviewSummary.averageRating.toFixed(1)} / 5 -{" "}
                {reviewSummary.reviewCount}&nbsp;
                {locale === "uk" ? "відгуків" : "отзывов"}
              </span>
            </>
          ) : (
            <span>
              {locale === "uk" ? "Ще немає відгуків" : "Пока нет отзывов"}
            </span>
          )}
        </div>
        {variants.length > 0 ? (
          <div className="mt-7 grid gap-3">
            <p className="text-sm font-bold text-foreground">
              {variantOptionName}
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const selected = variant.id === selectedVariant?.id;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/60"
                    }`}
                  >
                    {variant.colorHex ? (
                      <span
                        className="size-4 rounded-full border border-border bg-white"
                        style={{ backgroundColor: variant.colorHex }}
                        aria-hidden="true"
                      />
                    ) : null}
                    {getVariantName(variant, locale)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="mt-7 flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold text-foreground">
            {formatPrice(displayPrice)} {dictionary.common.currency}
          </span>
          {salePrice ? (
            <span className="pb-1 text-lg font-medium text-muted-foreground line-through">
              {formatPrice(regularPrice)} {dictionary.common.currency}
            </span>
          ) : null}
        </div>
        <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm sm:grid-cols-2">
          <div>
            <span className="font-semibold text-foreground">
              {dictionary.product.sku}:
            </span>{" "}
            {sku}
          </div>
          <div>
            <span className="font-semibold text-foreground">
              {dictionary.product.brand}:
            </span>{" "}
            {product.brand}
          </div>
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <CheckCircle2 className="size-4 text-primary" />
            ) : (
              <Package className="size-4 text-muted-foreground" />
            )}
            <span>
              {isAvailable
                ? `${dictionary.common.inStock}: ${stock}`
                : dictionary.product.unavailable}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-primary" />
            <span>{dictionary.product.delivery}</span>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <AddToCartButton
            productId={product.id}
            variantId={selectedVariant?.id}
            maxQuantity={stock}
            label={dictionary.actions.addToCart}
            disabled={!isAvailable}
            size="lg"
          />
          <SaveProductButton
            productId={product.id}
            locale={locale}
            mode="inline"
          />
          <Button asChild size="lg" variant="outline">
            <Link href={`/${locale}/delivery-payment`}>
              {dictionary.product.delivery}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
