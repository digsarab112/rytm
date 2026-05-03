import { Star } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { ReviewItem } from "@/types/store";

type ReviewsSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  reviews?: ReviewItem[];
};

export function ReviewsSection({
  locale,
  dictionary,
  reviews = [],
}: ReviewsSectionProps) {
  return (
    <section className="bg-card py-14 md:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={dictionary.homepage.reviews} />
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-lg border border-border bg-background p-6 shadow-sm"
            >
              <div className="flex gap-1 text-primary" aria-label={`${review.rating}/5`}>
                {Array.from({ length: review.rating }).map((_, index) => (
                  <Star key={index} className="size-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                “{review.text[locale]}”
              </p>
              <div className="mt-5">
                <p className="font-semibold text-foreground">{review.author}</p>
                <p className="text-sm text-muted-foreground">{review.city[locale]}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
