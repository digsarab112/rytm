import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { CustomerCopy } from "@/lib/customer/customer-copy";
import type { SiteSettings } from "@/types/store";

type CustomerShellProps = {
  locale: Locale;
  copy: CustomerCopy;
  settings: SiteSettings;
  children: React.ReactNode;
};

export function CustomerShell({
  locale,
  copy,
  settings,
  children,
}: CustomerShellProps) {
  const alternateLocale = locale === "uk" ? "ru" : "uk";

  return (
    <main className="min-h-screen bg-[#f7ece2]">
      <section className="border-b border-border bg-card/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
          <Logo
            locale={locale}
            slogan={settings.slogan[locale]}
            storeName={settings.storeName}
            logoText={settings.branding?.logoText}
          />
          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {copy.account}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {copy.localMode}
          </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}`}>{copy.backToStore}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`?locale=${alternateLocale}`}>
                {alternateLocale.toUpperCase()}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-4 shadow-xl sm:p-6">
          {children}
        </div>
      </section>
    </main>
  );
}
