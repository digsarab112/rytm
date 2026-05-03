export const locales = ["uk", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localizePath(path: string, locale: Locale) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}
