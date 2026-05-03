"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";
import type { StorefrontConfig } from "@/types/platform";

const StorefrontConfigContext = createContext<StorefrontConfig | null>(null);

type StorefrontConfigProviderProps = {
  locale: Locale;
  initialConfig: StorefrontConfig;
  children: ReactNode;
};

export function StorefrontConfigProvider({
  locale,
  initialConfig,
  children,
}: StorefrontConfigProviderProps) {
  const pathname = usePathname();
  const config = initialConfig;

  useEffect(() => {
    const { colors, seo, branding } = config.settings;

    document.documentElement.style.setProperty("--primary", colors.primary);
    document.documentElement.style.setProperty("--ring", colors.primary);
    document.documentElement.style.setProperty("--secondary", colors.secondary);
    document.documentElement.style.setProperty("--accent", colors.accent);

    if (pathname === `/${locale}`) {
      document.title = `${seo.title[locale]} | ${config.settings.storeName}`;
      const descriptionMeta = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );
      descriptionMeta?.setAttribute("content", seo.description[locale]);
    }

    if (branding?.faviconAsset) {
      document
        .querySelector<HTMLLinkElement>('link[rel="icon"]')
        ?.setAttribute("href", branding.faviconAsset);
    }
  }, [config.settings, locale, pathname]);

  const value = useMemo(() => config, [config]);

  return (
    <StorefrontConfigContext.Provider value={value}>
      <div className="storefront-config-shell">{children}</div>
    </StorefrontConfigContext.Provider>
  );
}

export function useStorefrontConfig() {
  const config = useContext(StorefrontConfigContext);

  if (!config) {
    throw new Error("useStorefrontConfig must be used inside StorefrontConfigProvider");
  }

  return config;
}
