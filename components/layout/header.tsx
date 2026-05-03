import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CartButton } from "@/components/cart/cart-button";
import { AccountLinkButton } from "@/components/customer/account-link-button";
import { AdminHeaderLink } from "@/components/layout/admin-header-link";
import { DesktopCategoryBrowser } from "@/components/layout/desktop-category-browser";
import { HeaderSearch } from "@/components/layout/header-search";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav, type NavLinkItem } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  buildCategoryTree,
  type CategoryTreeNode,
} from "@/lib/catalog/category-tree";
import { getCategoryName } from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductPreview,
  SiteSettings,
} from "@/types/store";

type HeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
  categories?: CategoryPreview[];
  products?: ProductPreview[];
  attributeDefinitions?: ProductAttributeDefinition[];
};

export function Header({
  locale,
  dictionary,
  settings,
  categories = [],
  products = [],
  attributeDefinitions = [],
}: HeaderProps) {
  const accountLabel = locale === "uk" ? "Кабінет" : "Кабинет";
  const menuCopy = getMenuCopy(locale);
  const headerCategoryTree = buildCategoryTree(categories, {
    activeOnly: true,
    headerOnly: true,
  });
  const quickCategoryLinks = headerCategoryTree;

  const navLinks: NavLinkItem[] = [
    { href: `/${locale}/catalog`, label: dictionary.navigation.catalog },
    { href: `/${locale}/delivery-payment`, label: dictionary.navigation.delivery },
    { href: `/${locale}/contact`, label: dictionary.navigation.contact },
    { href: `/account?locale=${locale}`, label: accountLabel },
  ];
  const mobileNavLinks: NavLinkItem[] = [
    navLinks[0],
    { href: `/${locale}/search`, label: dictionary.actions.search },
    ...navLinks.slice(1),
  ];

  const categoryLinks = headerCategoryTree.map((category) =>
    toCategoryNavItem(category, locale),
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="border-b border-border/70 bg-card/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs leading-5 text-muted-foreground sm:px-6 lg:px-8">
          <p className="min-w-0 truncate">{settings.slogan[locale]}</p>
          <Link
            href={`tel:${settings.contactPhone.replaceAll(" ", "")}`}
            className="hidden shrink-0 font-semibold text-foreground hover:text-primary sm:block"
          >
            {settings.contactPhone}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <MobileNav
          locale={locale}
          slogan={settings.slogan[locale]}
          storeName={settings.storeName}
          logoText={settings.branding?.logoText}
          logoAsset={settings.branding?.logoAsset}
          menuLabel={dictionary.actions.openMenu}
          navigationTitle={dictionary.navigation.catalog}
          navLinks={mobileNavLinks}
          categoryLinks={categoryLinks}
        />
        <Logo
          locale={locale}
          slogan={settings.slogan[locale]}
          storeName={settings.storeName}
          logoText={settings.branding?.logoText}
          logoAsset={settings.branding?.logoAsset}
          className="flex-1 sm:flex-none"
        />
        <nav className="ml-3 hidden shrink-0 items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Button asChild variant="ghost" size="sm" key={link.href}>
              <Link href={link.href} className="whitespace-nowrap">
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderSearch
            locale={locale}
            label={dictionary.actions.search}
            products={products}
            categories={categories}
            attributeDefinitions={attributeDefinitions}
          />
          <LanguageSwitcher
            activeLocale={locale}
            label={dictionary.common.language}
          />
          <AccountLinkButton locale={locale} label={accountLabel} />
          <CartButton locale={locale} label={dictionary.actions.cart} />
          <AdminHeaderLink />
        </div>
      </div>
      <div className="hidden border-t border-border/70 bg-card/50 lg:block">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 px-8 py-2">
          <DesktopCategoryBrowser
            categories={headerCategoryTree}
            locale={locale}
            label={menuCopy.allCategories}
            heading={menuCopy.heading}
            description={menuCopy.description}
          />
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scroll-smooth pr-2">
            {quickCategoryLinks.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/catalog?category=${category.slug}`}
                className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {getCategoryName(category, locale)}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function toCategoryNavItem(
  category: CategoryTreeNode,
  locale: Locale,
): NavLinkItem {
  return {
    href: `/${locale}/catalog?category=${category.slug}`,
    label: getCategoryName(category, locale),
    children: category.children.map((child) => toCategoryNavItem(child, locale)),
  };
}

function getMenuCopy(locale: Locale) {
  return locale === "uk"
    ? {
        allCategories: "Усі категорії",
        heading: "Каталог товарів",
        description:
          "Оберіть основний розділ або відкрийте потрібну підкатегорію.",
      }
    : {
        allCategories: "Все категории",
        heading: "Каталог товаров",
        description:
          "Выберите основной раздел или откройте нужную подкатегорию.",
      };
}
