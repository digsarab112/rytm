import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";

import { HeroMediaShowcase } from "@/components/home/hero-media-showcase";
import { Button } from "@/components/ui/button";
import { getCategoryName } from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { CategoryPreview, SiteSettings } from "@/types/store";

type HeroSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
  categories?: CategoryPreview[];
};

export function HeroSection({
  locale,
  dictionary,
  settings,
  categories = [],
}: HeroSectionProps) {
  const previewCategories = categories
    .filter((category) => category.showOnHomepage)
    .slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#f7ece2]">
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-card/35" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:min-h-[620px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm">
            {settings.hero.eyebrow[locale]}
          </p>
          <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {settings.hero.title[locale]}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            {settings.hero.subtitle[locale]}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/${locale}/catalog`}>
                {settings.hero.ctaText[locale]}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/${locale}/delivery-payment`}>
                {settings.hero.secondaryCtaText[locale]}
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-primary" />
              <span>{dictionary.homepage.deliveryPayment}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>{dictionary.common.inStock}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <HeroMediaShowcase
            locale={locale}
            storeName={settings.storeName}
            slides={settings.heroMediaSlides}
            fallbackHeroImage={settings.visuals?.heroImage}
          />
          {previewCategories.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:absolute lg:inset-x-6 lg:bottom-6 lg:mt-0">
              {previewCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/catalog?category=${category.slug}`}
                  className="rounded-lg border border-white/70 bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition-colors hover:text-primary"
                >
                  {getCategoryName(category, locale)}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
