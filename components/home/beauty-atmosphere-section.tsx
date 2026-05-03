import Link from "next/link";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";

import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SiteSettings } from "@/types/store";

const copy = {
  uk: {
    eyebrow: "Rytm care",
    title: "Візуальний простір для спокійної beauty-рутини",
    firstTitle: "М'яка добірка",
    secondTitle: "Щоденний wellness",
    secondText:
      "Зображення секцій можна змінити в адмінці, не торкаючись коду.",
  },
  ru: {
    eyebrow: "Rytm care",
    title: "Визуальное пространство для спокойной beauty-рутины",
    firstTitle: "Мягкая подборка",
    secondTitle: "Ежедневный wellness",
    secondText:
      "Изображения секций можно менять в админке, не трогая код.",
  },
} as const;

type BeautyAtmosphereSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
};

export function BeautyAtmosphereSection({
  locale,
  dictionary,
  settings,
}: BeautyAtmosphereSectionProps) {
  const localizedCopy = copy[locale];

  return (
    <section className="bg-[#fffaf5] py-14 md:py-18">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:px-8">
        <VisualMedia
          imageUrl={settings.visuals?.wellnessImage}
          label={`${settings.storeName} wellness visual`}
          tone="sage"
          className="aspect-[5/4] rounded-lg border border-border shadow-sm"
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            {localizedCopy.eyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-foreground md:text-4xl">
            {localizedCopy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            {settings.description[locale]}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <Sparkles className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-bold text-foreground">
                {localizedCopy.firstTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {settings.footerText[locale]}
              </p>
            </article>
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <Leaf className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-bold text-foreground">
                {localizedCopy.secondTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {localizedCopy.secondText}
              </p>
            </article>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href={`/${locale}/catalog`}>
                {dictionary.actions.shopNow}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/delivery-payment`}>
                {dictionary.actions.learnMore}
              </Link>
            </Button>
          </div>
          <VisualMedia
            imageUrl={settings.visuals?.sectionImage}
            label={`${settings.storeName} section visual`}
            tone="rose"
            className="mt-8 aspect-[16/5] rounded-lg border border-border shadow-sm"
          />
        </div>
      </div>
    </section>
  );
}
