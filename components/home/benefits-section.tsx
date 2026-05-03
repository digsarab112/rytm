import { Leaf, PackageCheck, ShieldCheck } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { BenefitItem } from "@/types/store";

const icons = [Leaf, PackageCheck, ShieldCheck];

type BenefitsSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  benefits?: BenefitItem[];
};

export function BenefitsSection({
  locale,
  dictionary,
  benefits = [],
}: BenefitsSectionProps) {
  return (
    <section className="bg-background py-14 md:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={dictionary.homepage.whyChooseUs} />
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = icons[index] ?? ShieldCheck;

            return (
              <article
                key={benefit.id}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {benefit.title[locale]}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {benefit.text[locale]}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
