"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Locale } from "@/lib/i18n/config";

export type NavLinkItem = {
  href: string;
  label: string;
  children?: NavLinkItem[];
};

type MobileNavProps = {
  locale: Locale;
  slogan: string;
  storeName: string;
  logoText?: string;
  logoAsset?: string;
  menuLabel: string;
  navigationTitle: string;
  navLinks?: NavLinkItem[];
  categoryLinks?: NavLinkItem[];
};

export function MobileNav({
  locale,
  slogan,
  storeName,
  logoText,
  logoAsset,
  menuLabel,
  navigationTitle,
  navLinks = [],
  categoryLinks = [],
}: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label={menuLabel}
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="h-dvh w-[min(92vw,420px)] max-w-none gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 pr-14">
          <SheetTitle className="sr-only">{navigationTitle}</SheetTitle>
          <Logo
            locale={locale}
            slogan={slogan}
            storeName={storeName}
            logoText={logoText}
            logoAsset={logoAsset}
          />
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-2">
            {navLinks.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg border border-transparent px-3 py-3 text-base font-semibold text-foreground transition-colors hover:border-border hover:bg-muted"
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>
          {categoryLinks.length > 0 ? (
            <section className="mt-5 border-t border-border pt-5">
              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {navigationTitle}
              </p>
              <div className="grid gap-2">
                {categoryLinks.map((item) => (
                  <MobileCategoryLink key={item.href} item={item} depth={0} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileCategoryLink({
  item,
  depth,
}: {
  item: NavLinkItem;
  depth: number;
}) {
  if (item.children && item.children.length > 0) {
    return (
      <details className="group rounded-lg border border-border bg-background">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-1 border-t border-border p-2">
          <SheetClose asChild>
            <Link
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
            >
              {item.label}
            </Link>
          </SheetClose>
          {item.children.map((child) => (
            <MobileCategoryLink key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      </details>
    );
  }

  return (
    <SheetClose asChild>
      <Link
        href={item.href}
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        style={{ paddingLeft: `${12 + Math.min(depth, 2) * 10}px` }}
      >
        {item.label}
      </Link>
    </SheetClose>
  );
}
