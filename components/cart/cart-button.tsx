"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

type CartButtonProps = {
  locale: Locale;
  label: string;
};

export function CartButton({ locale, label }: CartButtonProps) {
  const { totalQuantity, isReady } = useCart();

  return (
    <Button asChild variant="outline" size="icon">
      <Link href={`/${locale}/cart`} aria-label={label} className="relative">
        <ShoppingBag />
        {isReady && totalQuantity > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
            {totalQuantity}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
