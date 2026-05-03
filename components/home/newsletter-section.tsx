"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/customer/newsletter-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/types/store";

type NewsletterSectionProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
};

export function NewsletterSection({
  locale,
  dictionary,
  settings,
}: NewsletterSectionProps) {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    {},
  );

  return (
    <section className="bg-[#efe2d4] py-14 md:py-18">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_0.9fr] md:items-center lg:px-8">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-primary">
            <Mail className="size-4" />
            {dictionary.homepage.newsletter}
          </p>
          <h2 className="max-w-xl text-3xl font-bold leading-tight text-foreground">
            {settings.slogan[locale]}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {settings.description[locale]}
          </p>
        </div>
        <div className="grid gap-4">
          <VisualMedia
            imageUrl={settings.visuals?.newsletterImage}
            label={`${settings.storeName} newsletter visual`}
            tone="cream"
            className="aspect-[16/7] rounded-lg border border-white/60 shadow-sm"
          />
          <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="locale" value={locale} />
            <Input
              name="email"
              type="email"
              placeholder={dictionary.homepage.newsletterPlaceholder}
              aria-label={dictionary.homepage.newsletterPlaceholder}
            />
            <Button type="submit" disabled={isPending}>
              {dictionary.actions.subscribe}
            </Button>
          </form>
          {state.status === "success" ? (
            <p className="text-sm font-semibold text-primary">
              {locale === "uk"
                ? "Дякуємо за підписку."
                : "Спасибо за подписку."}
            </p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm font-semibold text-primary">
              {locale === "uk"
                ? "Введіть коректний email."
                : "Введите корректный email."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
