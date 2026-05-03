import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import { VisualMedia } from "@/components/home/visual-media";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/catalog/category-tree";
import {
  getCategoryDescription,
  getCategoryName,
  getProductCountForCategory,
} from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { CategoryPreview, ProductPreview } from "@/types/store";

const toneClasses: Record<CategoryPreview["tone"], string> = {
  rose: "bg-[#f8dfda]",
  sage: "bg-[#dfefe5]",
  cream: "bg-[#f5eadb]",
  linen: "bg-[#eee2d4]",
};

type FeaturedCategoriesProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories?: CategoryPreview[];
  products?: ProductPreview[];
};

export function FeaturedCategories({
  locale,
  dictionary,
  categories = [],
  products = [],
}: FeaturedCategoriesProps) {
  const featuredCategories = flattenCategoryTree(
    buildCategoryTree(categories, { activeOnly: true, homepageOnly: true }),
  );

  return (
    <section className="bg-background py-14 md:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={dictionary.homepage.featuredCategories}
          description={dictionary.footer.catalogNote}
          actionHref={`/${locale}/catalog`}
          actionLabel={dictionary.actions.viewAll}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/catalog?category=${category.slug}`}
              className={cn(
                "group grid min-h-[22rem] overflow-hidden rounded-lg border border-border shadow-sm transition-transform hover:-translate-y-0.5",
                toneClasses[category.tone],
              )}
            >
              <VisualMedia
                imageUrl={category.image}
                label={getCategoryName(category, locale)}
                tone={category.tone}
                className="min-h-36 border-b border-white/55"
              />
              <div className="grid p-5">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {getProductCountForCategory(category.id, products)}+
                  </p>
                  <h3 className="mt-3 text-xl font-bold leading-tight text-foreground">
                    {getCategoryName(category, locale)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {getCategoryDescription(category, locale)}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between self-end">
                  <span className="text-sm font-semibold text-foreground">
                    {dictionary.actions.shopNow}
                  </span>
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
