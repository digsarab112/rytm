"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/home/product-visual";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/helpers";
import {
  getCartLines,
  getCartSubtotal,
  getDeliveryPrice,
} from "@/lib/cart/helpers";
import type { DeliveryPaymentSettings } from "@/types/admin";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ProductPreview } from "@/types/store";

type CartPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  products: ProductPreview[];
  deliveryPayment: DeliveryPaymentSettings;
};

export function CartPage({
  locale,
  dictionary,
  products,
  deliveryPayment,
}: CartPageProps) {
  const { items, updateQuantity, removeItem, isReady } = useCart();
  const lines = getCartLines(items, products, locale);
  const subtotal = getCartSubtotal(lines);
  const deliveryPrice = getDeliveryPrice(subtotal, deliveryPayment);
  const total = subtotal + deliveryPrice;

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Rytm
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-foreground">
            {dictionary.cart.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {dictionary.cart.subtitle}
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        {!isReady ? (
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="h-6 w-48 rounded-full bg-muted" />
            <div className="mt-5 h-28 rounded-lg bg-muted" />
          </div>
        ) : lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              {dictionary.cart.emptyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {dictionary.cart.emptyText}
            </p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}/catalog`}>
                {dictionary.actions.continueShopping}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {lines.map((line) => (
              <article
                key={`${line.productId}-${line.variantId ?? "base"}-${line.comboOfferId ?? "single"}`}
                className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-[128px_1fr]"
              >
                <Link href={`/${locale}/products/${line.slug}`}>
                  <ProductVisual
                    tone={line.tone}
                    imageUrl={line.imageUrl}
                    alt={line.name}
                    className="aspect-square"
                  />
                </Link>
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      {line.brand}
                    </p>
                    <Link
                      href={`/${locale}/products/${line.slug}`}
                      className="mt-2 block text-lg font-bold text-foreground hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {dictionary.product.sku}: {line.sku}
                    </p>
                    {line.variantLabel ? (
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        {line.variantLabel}
                      </p>
                    ) : null}
                    {line.comboDiscountPercent ? (
                      <p className="mt-1 text-sm font-semibold text-primary">
                        -{line.comboDiscountPercent}% bundle
                      </p>
                    ) : null}
                    <p className="mt-4 text-lg font-bold text-foreground">
                      {formatPrice(line.salePrice ?? line.price)}{" "}
                      {dictionary.common.currency}
                    </p>
                  </div>
                  <div className="grid content-between gap-4 md:justify-items-end">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="-"
                        onClick={() =>
                          updateQuantity(
                            line.productId,
                            line.quantity - 1,
                            line.stock,
                            line.variantId,
                            line.comboOfferId,
                          )
                        }
                      >
                        <Minus />
                      </Button>
                      <span className="inline-flex h-10 min-w-12 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-bold">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="+"
                        onClick={() =>
                          updateQuantity(
                            line.productId,
                            line.quantity + 1,
                            line.stock,
                            line.variantId,
                            line.comboOfferId,
                          )
                        }
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:grid md:justify-items-end">
                      <p className="text-lg font-bold text-foreground">
                        {formatPrice(line.lineTotal)} {dictionary.common.currency}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeItem(
                            line.productId,
                            line.variantId,
                            line.comboOfferId,
                          )
                        }
                      >
                        <Trash2 />
                        {dictionary.actions.remove}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <CartSummary
          locale={locale}
          dictionary={dictionary}
          subtotal={subtotal}
          deliveryPrice={deliveryPrice}
          total={total}
          canCheckout={isReady && lines.length > 0}
        />
      </section>
    </div>
  );
}

function CartSummary({
  locale,
  dictionary,
  subtotal,
  deliveryPrice,
  total,
  canCheckout,
}: {
  locale: Locale;
  dictionary: Dictionary;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  canCheckout: boolean;
}) {
  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-bold text-foreground">{dictionary.cart.summary}</h2>
      <div className="mt-5 grid gap-3 text-sm">
        <SummaryRow
          label={dictionary.cart.subtotal}
          value={`${formatPrice(subtotal)} ${dictionary.common.currency}`}
        />
        <SummaryRow
          label={dictionary.cart.delivery}
          value={
            deliveryPrice === 0
              ? dictionary.cart.freeDelivery
              : `${formatPrice(deliveryPrice)} ${dictionary.common.currency}`
          }
        />
        <div className="border-t border-border pt-3">
          <SummaryRow
            label={dictionary.cart.total}
            value={`${formatPrice(total)} ${dictionary.common.currency}`}
            strong
          />
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        {dictionary.cart.deliveryNote}
      </p>
      <div className="mt-6 grid gap-2">
        <Button asChild disabled={!canCheckout}>
          <Link href={canCheckout ? `/${locale}/checkout` : `/${locale}/cart`}>
            {dictionary.actions.checkout}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/${locale}/catalog`}>
            {dictionary.actions.continueShopping}
          </Link>
        </Button>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          strong
            ? "text-lg font-bold text-foreground"
            : "font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
