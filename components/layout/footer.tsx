import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { buildCategoryTree } from "@/lib/catalog/category-tree";
import { getCategoryName } from "@/lib/catalog/helpers";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CategoryPreview, SiteSettings } from "@/types/store";

type FooterProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
  categories?: CategoryPreview[];
};

export function Footer({
  locale,
  dictionary,
  settings,
  categories = [],
}: FooterProps) {
  const topCategories = buildCategoryTree(categories, { activeOnly: true }).slice(
    0,
    6,
  );
  const buyerLinks = [
    { href: `/${locale}/catalog`, label: dictionary.navigation.catalog },
    { href: `/${locale}/delivery-payment`, label: dictionary.navigation.delivery },
    { href: `/${locale}/contact`, label: dictionary.navigation.contact },
    {
      href: `/account?locale=${locale}`,
      label: locale === "uk" ? "Кабінет покупця" : "Кабинет покупателя",
    },
  ];
  const policyLinks = [
    { href: `/${locale}/privacy-policy`, label: dictionary.navigation.privacy },
    { href: `/${locale}/terms`, label: dictionary.navigation.terms },
    { href: `/${locale}/return-policy`, label: dictionary.navigation.returns },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.35fr_1.1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo
            locale={locale}
            slogan={settings.slogan[locale]}
            storeName={settings.storeName}
            logoText={settings.branding?.logoText}
            logoAsset={settings.branding?.logoAsset}
          />
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {settings.footerText[locale]}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {locale === "uk" ? "Покупцям" : "Покупателям"}
          </h2>
          <div className="mt-4 grid gap-3 text-sm font-medium text-muted-foreground">
            {buyerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
          {topCategories.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {dictionary.navigation.catalog}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/${locale}/catalog?category=${category.slug}`}
                    className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {getCategoryName(category, locale)}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid gap-8">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {dictionary.footer.contacts}
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <Link
                href={`tel:${settings.contactPhone.replaceAll(" ", "")}`}
                className="font-medium hover:text-primary"
              >
                {settings.contactPhone}
              </Link>
              <Link
                href={`mailto:${settings.contactEmail}`}
                className="font-medium hover:text-primary"
              >
                {settings.contactEmail}
              </Link>
              <span>{dictionary.footer.catalogNote}</span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {dictionary.footer.policies}
            </h2>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {policyLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} {settings.storeName}.{" "}
            {dictionary.footer.copyright}
          </p>
          <p>{settings.slogan[locale]}</p>
        </div>
      </div>
    </footer>
  );
}
