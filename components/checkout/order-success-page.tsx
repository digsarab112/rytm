"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/helpers";
import { ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import { getCheckoutOrder } from "@/lib/checkout/order-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { MockOrder } from "@/types/cart";

type OrderSuccessPageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function OrderSuccessPage({
  locale,
  dictionary,
}: OrderSuccessPageProps) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    window.setTimeout(async () => {
      if (!isMounted) {
        return;
      }

      const orderId = searchParams.get("order");

      try {
        const storedOrders = JSON.parse(
          window.localStorage.getItem(ORDERS_STORAGE_KEY) ?? "[]",
        ) as MockOrder[];
        const storedOrder = storedOrders.find((item) => item.id === orderId);

        if (storedOrder) {
          setOrder(storedOrder);
        } else if (orderId) {
          const result = await getCheckoutOrder(orderId);
          setOrder(result.ok ? result.order : null);
        } else {
          setOrder(null);
        }
      } catch {
        setOrder(null);
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  if (!isReady) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="h-8 w-64 rounded-full bg-muted" />
          <div className="mt-5 h-24 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">
            {dictionary.order.noOrderTitle}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {dictionary.order.noOrderText}
          </p>
          <Button asChild className="mt-6">
            <Link href={`/${locale}/catalog`}>
              {dictionary.order.backToCatalog}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Rytm
              </p>
              <h1 className="text-4xl font-bold leading-tight text-foreground">
                {dictionary.order.successTitle}
              </h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {dictionary.order.successText}
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label={dictionary.order.orderNumber} value={order.id} />
            <Info label={dictionary.order.status} value={dictionary.order.newStatus} />
            <Info label={dictionary.checkout.name} value={order.customerName} />
            <Info label={dictionary.checkout.phone} value={order.phone} />
            <Info label={dictionary.checkout.city} value={order.city} />
            <Info
              label={dictionary.checkout.novaPoshtaBranch}
              value={order.novaPoshtaBranch}
            />
          </div>
          <div className="mt-8 grid gap-4">
            {order.items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId ?? "base"}-${item.sku}`}
                className="flex items-start justify-between gap-4 border-t border-border pt-4"
              >
                <div>
                  <p className="font-bold text-foreground">
                    {locale === "uk" ? item.nameUk : item.nameRu}
                  </p>
                  {item.variantLabelUk || item.variantLabelRu ? (
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {locale === "uk"
                        ? item.variantLabelUk ?? item.variantLabelRu
                        : item.variantLabelRu ?? item.variantLabelUk}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.quantity} × {formatPrice(item.price)}{" "}
                    {dictionary.common.currency}
                  </p>
                </div>
                <p className="font-bold text-foreground">
                  {formatPrice(item.lineTotal)} {dictionary.common.currency}
                </p>
              </div>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">
            {dictionary.cart.summary}
          </h2>
          <div className="mt-5 grid gap-3 text-sm">
            <SummaryRow
              label={dictionary.cart.subtotal}
              value={`${formatPrice(order.subtotal)} ${dictionary.common.currency}`}
            />
            {order.discountTotal && order.discountTotal > 0 ? (
              <SummaryRow
                label={
                  locale === "uk"
                    ? `Знижка${order.couponCode ? ` (${order.couponCode})` : ""}`
                    : `Скидка${order.couponCode ? ` (${order.couponCode})` : ""}`
                }
                value={`-${formatPrice(order.discountTotal)} ${dictionary.common.currency}`}
              />
            ) : null}
            <SummaryRow
              label={dictionary.cart.delivery}
              value={
                order.deliveryPrice === 0
                  ? dictionary.cart.freeDelivery
                  : `${formatPrice(order.deliveryPrice)} ${dictionary.common.currency}`
              }
            />
            <div className="border-t border-border pt-3">
              <SummaryRow
                label={dictionary.cart.total}
                value={`${formatPrice(order.total)} ${dictionary.common.currency}`}
                strong
              />
            </div>
          </div>
          <Button asChild className="mt-6 w-full">
            <Link href={`/${locale}/catalog`}>
              {dictionary.order.backToCatalog}
            </Link>
          </Button>
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-bold text-foreground">{value}</p>
    </div>
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
