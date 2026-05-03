import type { ProductPreview } from "@/types/store";

const legacyProductImageAliases: Record<string, string> = {
  "body-oil-1": "/visuals/realistic/product-body-oil-main.jpg",
  "body-oil-2": "/visuals/realistic/product-body-oil-detail.jpg",
  "body-oil-3": "/visuals/realistic/product-body-oil-lifestyle.jpg",
  "calm-cleanser-1": "/visuals/realistic/product-calm-cleanser-main.jpg",
  "calm-cleanser-2": "/visuals/realistic/product-calm-cleanser-detail.jpg",
  "calm-cleanser-3": "/visuals/realistic/product-calm-cleanser-lifestyle.jpg",
  "daily-cream-1": "/visuals/realistic/product-daily-cream-main.jpg",
  "daily-cream-2": "/visuals/realistic/product-daily-cream-detail.jpg",
  "daily-cream-3": "/visuals/realistic/product-daily-cream-lifestyle.jpg",
  "hand-cream-1": "/visuals/realistic/product-hand-cream-main.jpg",
  "hand-cream-2": "/visuals/realistic/product-hand-cream-detail.jpg",
  "hand-cream-3": "/visuals/realistic/product-hand-cream-lifestyle.jpg",
  "magnesium-bath-1": "/visuals/realistic/product-magnesium-bath-main.jpg",
  "magnesium-bath-2": "/visuals/realistic/product-magnesium-bath-detail.jpg",
  "magnesium-bath-3": "/visuals/realistic/product-magnesium-bath-lifestyle.jpg",
  "scalp-serum-1": "/visuals/realistic/product-scalp-serum-main.jpg",
  "scalp-serum-2": "/visuals/realistic/product-scalp-serum-detail.jpg",
  "scalp-serum-3": "/visuals/realistic/product-scalp-serum-lifestyle.jpg",
  "shine-mask-1": "/visuals/realistic/product-shine-mask-main.jpg",
  "shine-mask-2": "/visuals/realistic/product-shine-mask-detail.jpg",
  "shine-mask-3": "/visuals/realistic/product-shine-mask-lifestyle.jpg",
  "spf-fluid-1": "/visuals/realistic/product-spf-fluid-main.jpg",
  "spf-fluid-2": "/visuals/realistic/product-spf-fluid-detail.jpg",
  "spf-fluid-3": "/visuals/realistic/product-spf-fluid-lifestyle.jpg",
};

const unreliableSeedImageHosts = ["ezebra.com.ua"];

export function normalizeProductImageUrl(value: string) {
  const normalizedValue = value.trim();

  return legacyProductImageAliases[normalizedValue] ?? normalizedValue;
}

export function normalizeProductImageUrls(values: string | string[]) {
  const rawValues = Array.isArray(values) ? values : values.split(/\n|,/);
  const seen = new Set<string>();

  return rawValues
    .map(normalizeProductImageUrl)
    .filter(Boolean)
    .filter((imageUrl) => {
      if (seen.has(imageUrl)) {
        return false;
      }

      seen.add(imageUrl);
      return true;
    });
}

export function isPreviewableProductImageUrl(imageUrl?: string) {
  const normalizedUrl = imageUrl?.trim();

  return Boolean(
    normalizedUrl &&
      (normalizedUrl.startsWith("/") ||
        normalizedUrl.startsWith("http://") ||
        normalizedUrl.startsWith("https://")),
  );
}

export function getPrimaryProductImage(product: ProductPreview) {
  return normalizeProductImageUrls(product.images ?? [])[0];
}

export function isUnreliableSeedProductImageUrl(imageUrl?: string) {
  const normalizedUrl = imageUrl?.trim();

  return Boolean(
    normalizedUrl &&
      unreliableSeedImageHosts.some((host) => normalizedUrl.includes(host)),
  );
}
