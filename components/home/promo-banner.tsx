import Link from "next/link";
import { BadgePercent } from "lucide-react";

import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/types/store";

type PromoBannerProps = {
  locale: Locale;
  settings: SiteSettings;
};

export function PromoBanner({ locale, settings }: PromoBannerProps) {
  return (
    <section className="overflow-hidden bg-primary py-12 text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_280px] md:items-center lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal">
            <BadgePercent className="size-4" />
            Rytm
          </p>
          <h2 className="text-3xl font-bold leading-tight">
            {settings.promoBanner.title[locale]}
          </h2>
          <p className="mt-4 text-base leading-7 text-primary-foreground/85">
            {settings.promoBanner.text[locale]}
          </p>
          <div className="mt-7">
            <Button asChild variant="secondary" size="lg">
              <Link href={`/${locale}/catalog`}>
                {settings.promoBanner.ctaText[locale]}
              </Link>
            </Button>
          </div>
        </div>
        <VisualMedia
          imageUrl={settings.visuals?.promoImage}
          label={`${settings.storeName} promo visual`}
          tone="sage"
          className="hidden aspect-[4/3] rounded-lg border border-white/20 shadow-sm md:block"
        />
      </div>
    </section>
  );
}
