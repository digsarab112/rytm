"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCustomerSession } from "@/lib/customer/auth-storage";
import {
  CUSTOMER_SAVED_PRODUCTS_EVENT,
  readCustomerSavedProductIds,
} from "@/lib/customer/saved-products";
import type { Locale } from "@/lib/i18n/config";

type AccountLinkButtonProps = {
  locale: Locale;
  label: string;
};

export function AccountLinkButton({ locale, label }: AccountLinkButtonProps) {
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    function syncSavedCount() {
      const session = getCustomerSession();

      setSavedCount(
        session ? readCustomerSavedProductIds(session.customerId).length : 0,
      );
    }

    syncSavedCount();
    window.addEventListener(CUSTOMER_SAVED_PRODUCTS_EVENT, syncSavedCount);
    window.addEventListener("storage", syncSavedCount);

    return () => {
      window.removeEventListener(CUSTOMER_SAVED_PRODUCTS_EVENT, syncSavedCount);
      window.removeEventListener("storage", syncSavedCount);
    };
  }, []);

  return (
    <Button asChild variant="outline" size="icon" className="inline-flex shrink-0">
      <Link href={`/account?locale=${locale}`} aria-label={label} className="relative">
        <User />
        {savedCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
            {savedCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
