"use client";

import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import {
  StorefrontConfigProvider,
  useStorefrontConfig,
} from "@/components/storefront/storefront-config-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { StorefrontConfig } from "@/types/platform";

type ConfigurablePublicShellProps = {
  locale: Locale;
  dictionary: Dictionary;
  initialConfig: StorefrontConfig;
  children: React.ReactNode;
};

export function ConfigurablePublicShell({
  locale,
  dictionary,
  initialConfig,
  children,
}: ConfigurablePublicShellProps) {
  return (
    <StorefrontConfigProvider locale={locale} initialConfig={initialConfig}>
      <CartProvider>
        <PublicShellContent locale={locale} dictionary={dictionary}>
          {children}
        </PublicShellContent>
      </CartProvider>
    </StorefrontConfigProvider>
  );
}

function PublicShellContent({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const config = useStorefrontConfig();
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const products = Array.isArray(config.products) ? config.products : [];
  const attributeDefinitions = Array.isArray(config.attributeDefinitions)
    ? config.attributeDefinitions
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        locale={locale}
        dictionary={dictionary}
        settings={config.settings}
        categories={categories}
        products={products}
        attributeDefinitions={attributeDefinitions}
      />
      <main className="flex-1">{children}</main>
      <Footer
        locale={locale}
        dictionary={dictionary}
        settings={config.settings}
        categories={categories}
      />
    </div>
  );
}
