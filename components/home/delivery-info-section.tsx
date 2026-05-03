import { CreditCard, MessageCircle, Truck } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { DeliveryInfoItem } from "@/types/store";

const icons = [Truck, CreditCard, MessageCircle];

type DeliveryInfoSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  deliveryInfo?: DeliveryInfoItem[];
};

export function DeliveryInfoSection({
  locale,
  dictionary,
  deliveryInfo = [],
}: DeliveryInfoSectionProps) {
  return (
    <section className="bg-background py-14 md:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={dictionary.homepage.deliveryPayment} />
        <div className="grid gap-4 md:grid-cols-3">
          {deliveryInfo.map((item, index) => {
            const Icon = icons[index] ?? Truck;

            return (
              <article
                key={item.id}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <Icon className="size-6 text-primary" />
                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {item.title[locale]}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.text[locale]}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
