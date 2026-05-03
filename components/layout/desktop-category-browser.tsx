"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Grid3X3, Search } from "lucide-react";

import { VisualMedia } from "@/components/home/visual-media";
import { getCategoryName } from "@/lib/catalog/helpers";
import type { CategoryTreeNode } from "@/lib/catalog/category-tree";
import type { Locale } from "@/lib/i18n/config";

type DesktopCategoryBrowserProps = {
  categories: CategoryTreeNode[];
  locale: Locale;
  label: string;
  heading: string;
  description: string;
};

export function DesktopCategoryBrowser({
  categories,
  locale,
  label,
  heading,
  description,
}: DesktopCategoryBrowserProps) {
  const visibleCategories = useMemo(
    () => categories.filter((category) => !isGeneratedCategoryName(category)),
    [categories],
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    visibleCategories[0]?.id ?? "",
  );
  const activeCategory =
    visibleCategories.find((category) => category.id === activeCategoryId) ??
    visibleCategories[0];
  const activeChildren =
    activeCategory?.children.filter((child) => !isGeneratedCategoryName(child)) ??
    [];

  return (
    <div className="group relative shrink-0">
      <Link
        href={`/${locale}/catalog`}
        className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-bold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted"
      >
        <Grid3X3 className="size-4 text-primary" />
        {label}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 w-[min(1060px,calc(100vw-4rem))] pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="grid max-h-[78vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl lg:grid-cols-[270px_1fr]">
          <aside className="max-h-[78vh] overflow-y-auto border-r border-border bg-muted/45 py-3">
            <Link
              href={`/${locale}/catalog`}
              className="mx-3 mb-3 flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm"
            >
              <Grid3X3 className="size-4" />
              {heading}
            </Link>
            <div className="grid gap-1 px-2">
              {visibleCategories.map((category) => {
                const categoryLabel = getCategoryName(category, locale);
                const isActive = category.id === activeCategory?.id;

                return (
                  <Link
                    key={category.id}
                    href={`/${locale}/catalog?category=${category.slug}`}
                    onMouseEnter={() => setActiveCategoryId(category.id)}
                    onFocus={() => setActiveCategoryId(category.id)}
                    className={`grid min-h-[68px] grid-cols-[46px_1fr] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-card hover:text-primary ${
                      isActive ? "bg-card text-primary shadow-sm" : "text-foreground"
                    }`}
                  >
                    <VisualMedia
                      imageUrl={category.image}
                      label={categoryLabel}
                      tone={category.tone}
                      className="size-[46px] rounded-md border border-white/70"
                    />
                    <span className="line-clamp-2 leading-5">{categoryLabel}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
          <div className="max-h-[78vh] overflow-y-auto p-5">
            <Link
              href={`/${locale}/search`}
              className="mb-5 flex min-h-11 items-center gap-3 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Search className="size-4 shrink-0" />
              <span className="line-clamp-1">{description}</span>
            </Link>
            {activeCategory ? (
              <div className="grid gap-5">
                <div className="grid min-h-[106px] grid-cols-[72px_1fr] items-center gap-4 rounded-lg border border-border bg-background p-4">
                  <VisualMedia
                    imageUrl={activeCategory.image}
                    label={getCategoryName(activeCategory, locale)}
                    tone={activeCategory.tone}
                      className="size-[72px] rounded-lg border border-white/70"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/${locale}/catalog?category=${activeCategory.slug}`}
                        className="line-clamp-2 text-base font-black uppercase tracking-normal text-foreground hover:text-primary"
                      >
                        {getCategoryName(activeCategory, locale)}
                      </Link>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {locale === "uk"
                        ? activeCategory.descriptionUk
                        : activeCategory.descriptionRu}
                    </p>
                  </div>
                </div>
                {activeChildren.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                    {activeChildren.map((category) => (
                      <DesktopSubcategoryGroup
                        key={category.id}
                        category={category}
                        locale={locale}
                      />
                    ))}
                  </div>
                ) : (
                  <Link
                    href={`/${locale}/catalog?category=${activeCategory.slug}`}
                    className="rounded-lg border border-dashed border-border bg-background p-6 text-sm font-bold text-primary hover:bg-muted"
                  >
                    {locale === "uk"
                      ? "Перейти до товарів цього розділу"
                      : "Перейти к товарам этого раздела"}
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopSubcategoryGroup({
  category,
  locale,
}: {
  category: CategoryTreeNode;
  locale: Locale;
}) {
  const label = getCategoryName(category, locale);
  const href = `/${locale}/catalog?category=${category.slug}`;
  const visibleChildren = category.children.filter(
    (child) => !isGeneratedCategoryName(child),
  );

  return (
    <section className="grid min-h-[132px] grid-cols-[50px_1fr] gap-3 rounded-lg border border-border bg-background p-3">
      <Link href={href} className="block">
        <VisualMedia
          imageUrl={category.image}
          label={label}
          tone={category.tone}
          className="size-[50px] rounded-md border border-white/70"
        />
      </Link>
      <div className="min-w-0">
        <Link
          href={href}
          className="line-clamp-2 min-h-10 text-sm font-black uppercase tracking-normal text-foreground transition-colors hover:text-primary"
        >
          {label}
        </Link>
        {visibleChildren.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {visibleChildren.slice(0, 8).map((child) => (
              <Link
                key={child.id}
                href={`/${locale}/catalog?category=${child.slug}`}
                className="line-clamp-1 text-sm font-medium leading-5 text-muted-foreground transition-colors hover:text-primary"
              >
                {getCategoryName(child, locale)}
              </Link>
            ))}
            {visibleChildren.length > 8 ? (
              <Link
                href={href}
                className="mt-1 text-xs font-bold text-primary hover:underline"
              >
                {locale === "uk" ? "Показати більше" : "Показать больше"}
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
            {locale === "uk" ? category.descriptionUk : category.descriptionRu}
          </p>
        )}
      </div>
    </section>
  );
}

function isGeneratedCategoryName(category: CategoryTreeNode) {
  return (
    category.nameUk.trim() === "Підкатегорія догляду" ||
    category.nameRu.trim() === "Подкатегория ухода"
  );
}
