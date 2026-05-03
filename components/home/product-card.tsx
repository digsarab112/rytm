import Link from "next/link";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { SaveProductButton } from "@/components/customer/save-product-button";
import { ProductVisual } from "@/components/home/product-visual";
import { StarRating } from "@/components/product/star-rating";
import { getProductReviewSummary } from "@/lib/catalog/reviews";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import {
  formatPrice,
  getProductBadge,
  getProductDisplayPrice,
  getProductName,
  getProductSalePrice,
} from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview, ProductReview } from "@/types/store";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  locale: Locale;
  dictionary: Dictionary;
  product: ProductPreview;
  reviews?: ProductReview[];
  presentation?: "default" | "compactRail";
};

export function ProductCard({
  locale,
  dictionary,
  product,
  reviews = [],
  presentation = "default",
}: ProductCardProps) {
  const isCompactRail = presentation === "compactRail";
  const displayPrice = getProductDisplayPrice(product);
  const salePrice = getProductSalePrice(product);
  const badge =
    getProductBadge(product, locale)?.trim() ||
    (salePrice ? dictionary.common.sale : undefined);
  const isAvailable = product.status === "active" && product.stock > 0;
  const reviewSummary = getProductReviewSummary(reviews, product.id);
  const productName = getProductName(product, locale);
  const primaryImage = getPrimaryProductImage(product);

  return (
    <article className="group grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="relative">
        <Link href={`/${locale}/products/${product.slug}`} className="block">
          <ProductVisual
            tone={product.tone}
            imageUrl={primaryImage}
            alt={productName}
            surface="catalog"
            className={isCompactRail ? "aspect-square sm:aspect-[4/3]" : undefined}
          />
        </Link>
        <SaveProductButton
          productId={product.id}
          locale={locale}
          className="absolute right-3 top-3 opacity-95"
        />
      </div>
      <div
        className={cn(
          "grid h-full grid-rows-[1fr_auto]",
          isCompactRail ? "gap-3 p-3 sm:p-4" : "gap-4 p-4",
        )}
      >
        <div className="grid content-start gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {product.brand}
            </p>
            {badge ? (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {badge}
              </span>
            ) : null}
          </div>
          <Link
            href={`/${locale}/products/${product.slug}`}
            className={cn(
              "font-semibold leading-6 text-foreground hover:text-primary",
              isCompactRail ? "min-h-12 text-sm sm:text-base" : "min-h-12 text-base",
            )}
          >
            {productName}
          </Link>
          <div className="flex min-h-5 items-center gap-2 text-xs font-semibold text-muted-foreground">
            {reviewSummary.reviewCount > 0 ? (
              <>
                <StarRating rating={reviewSummary.averageRating} />
                <span>
                  {reviewSummary.averageRating.toFixed(1)} (
                  {reviewSummary.reviewCount})
                </span>
              </>
            ) : (
              <span>{locale === "uk" ? "Ще немає відгуків" : "Пока нет отзывов"}</span>
            )}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {isAvailable ? dictionary.common.inStock : dictionary.product.unavailable}
          </p>
        </div>
        <div className="grid min-h-[5.9rem] grid-cols-1 items-end gap-2 xl:min-h-[3.35rem] xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid min-w-0 content-end gap-0.5">
            <span
              className={cn(
                "block whitespace-nowrap font-bold leading-none text-foreground",
                isCompactRail ? "text-base sm:text-lg" : "text-lg",
              )}
            >
              {formatPrice(displayPrice)} {dictionary.common.currency}
            </span>
            <span
              className={cn(
                "min-h-4 whitespace-nowrap text-xs font-medium text-muted-foreground line-through",
                !salePrice && "invisible",
              )}
            >
              {formatPrice(product.price)} {dictionary.common.currency}
            </span>
          </div>
          <AddToCartButton
            productId={product.id}
            maxQuantity={product.stock}
            label={dictionary.actions.addToCart}
            disabled={!isAvailable}
            size="sm"
            className="w-full shrink-0 whitespace-nowrap px-3 text-[11px] sm:px-4 sm:text-xs xl:w-auto"
          />
        </div>
      </div>
    </article>
  );
}
