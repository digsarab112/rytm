"use client";

import Link from "next/link";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/home/product-visual";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  getProductDisplayPrice,
  getProductName,
} from "@/lib/catalog/helpers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductComboOffer, ProductPreview } from "@/types/store";

export type ProductComboDisplayOffer = ProductComboOffer & {
  targetProduct: ProductPreview;
  targetProducts: ProductPreview[];
};

type ProductComboOffersProps = {
  locale: Locale;
  dictionary: Dictionary;
  product: ProductPreview;
  offers: ProductComboDisplayOffer[];
};

export function ProductComboOffers({
  locale,
  dictionary,
  product,
  offers,
}: ProductComboOffersProps) {
  const { addItem } = useCart();
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);
  const visibleOffers = offers.slice(0, 4);

  if (visibleOffers.length === 0) {
    return null;
  }

  const maxDiscountPercent = visibleOffers.reduce(
    (max, offer) => Math.max(max, offer.discountPercent),
    0,
  );

  function addCombo(offer: ProductComboDisplayOffer) {
    const comboProducts = [product, ...getOfferTargetProducts(offer)];
    const comboProductIds = comboProducts.map((comboProduct) => comboProduct.id);

    comboProducts.forEach((comboProduct) => {
      addItem(comboProduct.id, 1, comboProduct.stock, undefined, {
        comboOfferId: offer.id,
        comboSourceProductId: product.id,
        comboProductIds,
        comboDiscountPercent: offer.discountPercent,
      });
    });

    setAddedOfferId(offer.id);
    window.setTimeout(() => setAddedOfferId(null), 1400);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-primary">
              {locale === "uk" ? "Разом вигідніше" : "Вместе выгоднее"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {locale === "uk" ? "Комплект зі знижкою" : "Комплект со скидкой"}
            </h2>
          </div>
          <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
            {locale === "uk" ? "знижка до" : "скидка до"} {maxDiscountPercent}%
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {visibleOffers.map((offer) => {
            const comboProducts = [product, ...getOfferTargetProducts(offer)];
            const regularTotal = comboProducts.reduce(
              (total, comboProduct) =>
                total + getProductDisplayPrice(comboProduct),
              0,
            );
            const discountAmount = Math.round(
              regularTotal * (offer.discountPercent / 100),
            );
            const comboTotal = Math.max(0, regularTotal - discountAmount);
            const title =
              (locale === "uk" ? offer.titleUk : offer.titleRu)?.trim() ||
              (locale === "uk"
                ? `Разом дешевше на ${offer.discountPercent}%`
                : `Вместе дешевле на ${offer.discountPercent}%`);
            const description =
              (locale === "uk" ? offer.descriptionUk : offer.descriptionRu)?.trim() ||
              (locale === "uk"
                ? "Додайте комплект у кошик і отримайте спеціальну ціну на всі товари."
                : "Добавьте комплект в корзину и получите специальную цену на все товары.");

            return (
              <article
                key={offer.id}
                className="grid gap-4 rounded-lg border border-border bg-background p-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-center md:p-4"
              >
                <div className="grid gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-foreground sm:text-lg">
                        {title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    <span className="w-fit shrink-0 rounded-full bg-card px-3 py-1 text-xs font-bold text-primary">
                      -{offer.discountPercent}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {comboProducts.map((comboProduct, index) => (
                      <div
                        key={comboProduct.id}
                        className="flex min-w-[230px] flex-1 items-center gap-2"
                      >
                        {index > 0 ? (
                          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary">
                            <Plus className="size-4" />
                          </span>
                        ) : null}
                        <ComboProductVisual
                          locale={locale}
                          product={comboProduct}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 rounded-lg bg-card p-3 md:justify-items-end">
                  <div className="flex items-end justify-between gap-3 md:grid md:justify-items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground md:text-right">
                        {locale === "uk" ? "Разом" : "Итого"}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground md:text-right">
                        {formatPrice(comboTotal)} {dictionary.common.currency}
                      </p>
                    </div>
                    <div className="text-right text-sm md:text-right">
                      <p className="text-muted-foreground line-through">
                        {formatPrice(regularTotal)} {dictionary.common.currency}
                      </p>
                      <p className="font-bold text-primary">
                        -{formatPrice(discountAmount)} {dictionary.common.currency}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={() => addCombo(offer)}
                  >
                    {addedOfferId === offer.id ? <Check /> : <ShoppingBag />}
                    {addedOfferId === offer.id
                      ? locale === "uk"
                        ? "Додано"
                        : "Добавлено"
                      : locale === "uk"
                        ? "Додати комплект"
                        : "Добавить комплект"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getOfferTargetProducts(offer: ProductComboDisplayOffer) {
  return offer.targetProducts?.length
    ? offer.targetProducts
    : [offer.targetProduct].filter(Boolean);
}

function ComboProductVisual({
  locale,
  product,
}: {
  locale: Locale;
  product: ProductPreview;
}) {
  const productName = getProductName(product, locale);

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="grid min-w-[190px] flex-1 grid-cols-[84px_1fr] items-center gap-3 rounded-lg bg-card p-2 text-left transition-colors hover:bg-muted sm:min-w-[210px] sm:grid-cols-[96px_1fr]"
    >
      <ProductVisual
        tone={product.tone}
        imageUrl={getPrimaryProductImage(product)}
        alt={productName}
        surface="thumbnail"
        className="h-20 w-20 aspect-square rounded-md sm:h-24 sm:w-24"
      />
      <span className="line-clamp-2 text-sm font-bold leading-5 text-foreground">
        {productName}
      </span>
    </Link>
  );
}
