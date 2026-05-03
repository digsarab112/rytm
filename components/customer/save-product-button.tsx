"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCustomerSession } from "@/lib/customer/auth-storage";
import {
  CUSTOMER_SAVED_PRODUCTS_EVENT,
  isProductSavedForCurrentCustomer,
  toggleSavedProductForCurrentCustomer,
} from "@/lib/customer/saved-products";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type SaveProductButtonProps = {
  productId: string;
  locale: Locale;
  mode?: "icon" | "inline";
  className?: string;
};

const labels = {
  uk: {
    save: "Зберегти",
    saved: "Збережено",
    login: "Увійдіть, щоб зберегти товар",
  },
  ru: {
    save: "Сохранить",
    saved: "Сохранено",
    login: "Войдите, чтобы сохранить товар",
  },
} as const;

export function SaveProductButton({
  productId,
  locale,
  mode = "icon",
  className,
}: SaveProductButtonProps) {
  const copy = labels[locale];
  const [isSaved, setIsSaved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    function syncState() {
      const session = getCustomerSession();

      setIsLoggedIn(Boolean(session));
      setIsSaved(session ? isProductSavedForCurrentCustomer(productId) : false);
    }

    syncState();
    window.addEventListener(CUSTOMER_SAVED_PRODUCTS_EVENT, syncState);
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener(CUSTOMER_SAVED_PRODUCTS_EVENT, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, [productId]);

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = `/auth/login?locale=${locale}`;
      return;
    }

    const result = toggleSavedProductForCurrentCustomer(productId);

    if (result.ok) {
      setIsSaved(result.saved);
    }
  }

  if (mode === "inline") {
    return (
      <Button
        type="button"
        size="lg"
        variant={isSaved ? "secondary" : "outline"}
        onClick={handleClick}
        className={className}
        aria-label={isLoggedIn ? copy.save : copy.login}
      >
        <Heart className={cn(isSaved && "fill-current")} />
        {isSaved ? copy.saved : copy.save}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary",
        isSaved && "border-primary bg-secondary text-primary",
        className,
      )}
      aria-label={isLoggedIn ? copy.save : copy.login}
      title={isLoggedIn ? copy.save : copy.login}
    >
      <Heart className={cn("size-4", isSaved && "fill-current")} />
    </button>
  );
}
