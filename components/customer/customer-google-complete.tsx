"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CUSTOMER_SESSION_STORAGE_KEY } from "@/lib/customer/storage";
import type { Locale } from "@/lib/i18n/config";
import type { CustomerSession } from "@/types/customer";

export function CustomerGoogleComplete({
  locale,
  session,
}: {
  locale: Locale;
  session: CustomerSession;
}) {
  const router = useRouter();

  useEffect(() => {
    window.localStorage.setItem(
      CUSTOMER_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
    router.replace(`/account?locale=${locale}`);
  }, [locale, router, session]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7ece2] px-4">
      <div className="rounded-lg border border-border bg-card p-6 text-center shadow-xl">
        <p className="text-base font-semibold text-foreground">
          {locale === "uk" ? "Вхід виконано" : "Вход выполнен"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "uk"
            ? "Відкриваємо ваш кабінет."
            : "Открываем ваш кабинет."}
        </p>
      </div>
    </main>
  );
}
