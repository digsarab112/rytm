import Link from "next/link";

import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  label?: string;
  className?: string;
};

export function LogoMark({ label = "Rytm", className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={label}
      className={cn("h-11 w-11 sm:h-12 sm:w-12", className)}
    >
      <rect width="48" height="48" rx="16" fill="#F6E9DF" />
      <path
        d="M14 30.5c3.2-8.1 7.4-11.9 12.4-11.4 4 .4 6.8 3.4 8.6 8.9"
        fill="none"
        stroke="#9F5F55"
        strokeLinecap="round"
        strokeWidth="3.5"
      />
      <path
        d="M15 18h10.2c4 0 6.8 2.4 6.8 5.9 0 3.3-2.7 5.9-6.5 5.9H20v6.2"
        fill="none"
        stroke="#2E2724"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <path
        d="M26.2 29.6 33 37"
        fill="none"
        stroke="#88A88F"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
    </svg>
  );
}

type LogoProps = {
  locale: Locale;
  slogan?: string;
  storeName?: string;
  logoText?: string;
  logoAsset?: string;
  className?: string;
};

export function Logo({
  locale,
  slogan,
  storeName = "Rytm",
  logoText,
  logoAsset,
  className,
}: LogoProps) {
  const displayName = logoText || storeName;
  const normalizedLogoAsset = logoAsset?.trim();
  const hasLogoAsset = Boolean(
    normalizedLogoAsset &&
      (normalizedLogoAsset.startsWith("/") ||
        normalizedLogoAsset.startsWith("http://") ||
        normalizedLogoAsset.startsWith("https://")),
  );

  return (
    <Link
      href={`/${locale}`}
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3",
        className,
      )}
      aria-label={`${displayName} home`}
    >
      {hasLogoAsset ? (
        <span
          role="img"
          aria-label={displayName}
          className="h-11 w-11 shrink-0 rounded-2xl bg-[#f6e9df] bg-contain bg-center bg-no-repeat sm:h-12 sm:w-12"
          style={{
            backgroundImage: `url(${JSON.stringify(normalizedLogoAsset)})`,
          }}
        />
      ) : (
        <LogoMark label={displayName} className="shrink-0" />
      )}
      <span className="min-w-0">
        <span className="block text-[1.25rem] font-bold leading-none tracking-normal text-foreground sm:text-[1.5rem]">
          {displayName}
        </span>
        {slogan ? (
          <span className="mt-1 hidden max-w-52 truncate text-xs font-medium text-muted-foreground sm:block">
            {slogan}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
