"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  activeLocale: Locale;
  label: string;
  className?: string;
  compact?: boolean;
};

function getLocalizedHref(pathname: string, locale: Locale) {
  const parts = pathname.split("/");

  if (parts[1] && locales.includes(parts[1] as Locale)) {
    parts[1] = locale;
    return parts.join("/") || `/${locale}`;
  }

  return `/${locale}`;
}

export function LanguageSwitcher({
  activeLocale,
  label,
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm",
        className,
      )}
    >
      {locales.map((locale) => (
        <Link
          key={locale}
          href={getLocalizedHref(pathname, locale)}
          className={cn(
            "rounded-full text-xs font-semibold uppercase leading-none transition-colors",
            compact ? "px-2 py-1" : "px-2.5 py-1.5 sm:px-3",
            activeLocale === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-current={activeLocale === locale ? "page" : undefined}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
