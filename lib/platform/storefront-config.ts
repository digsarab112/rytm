import { getDefaultDeliveryPaymentSettings } from "@/lib/admin/default-settings";
import {
  attributeDefinitions,
  benefits,
  categories,
  deliveryInfo,
  homepageSections,
  productReviews,
  products,
  reviews,
  siteSettings,
  suppliers,
} from "@/lib/mock/store";
import {
  isUnreliableSeedProductImageUrl,
  normalizeProductImageUrls,
} from "@/lib/catalog/product-images";
import type {
  StorefrontConfig,
  StorefrontConfigOverrides,
} from "@/types/platform";

export function getDefaultStorefrontConfig(): StorefrontConfig {
  return {
    settings: siteSettings,
    categories,
    products,
    suppliers,
    productReviews,
    attributeDefinitions,
    homepageSections,
    benefits,
    reviews,
    deliveryInfo,
    deliveryPayment: getDefaultDeliveryPaymentSettings(),
    coupons: [],
    orders: [],
    customers: [],
  };
}

export function mergeStorefrontConfig(
  config: StorefrontConfig,
  overrides: StorefrontConfigOverrides,
): StorefrontConfig {
  const settingsOverride = overrides.settings;

  return {
    settings: settingsOverride
      ? mergeSettings(config.settings, settingsOverride)
      : config.settings,
    categories: mergeCategoryArray(overrides.categories, config.categories),
    products: mergeProductArray(overrides.products, config.products),
    suppliers: getArrayOverride(overrides.suppliers, config.suppliers),
    productReviews: getArrayOverride(
      overrides.productReviews,
      config.productReviews,
    ),
    attributeDefinitions: getArrayOverride(
      overrides.attributeDefinitions,
      config.attributeDefinitions,
    ),
    homepageSections: getArrayOverride(
      overrides.homepageSections,
      config.homepageSections,
    ),
    benefits: Array.isArray(config.benefits) ? config.benefits : [],
    reviews: Array.isArray(config.reviews) ? config.reviews : [],
    deliveryInfo: Array.isArray(config.deliveryInfo) ? config.deliveryInfo : [],
    deliveryPayment: overrides.deliveryPayment
      ? {
          ...config.deliveryPayment,
          ...overrides.deliveryPayment,
        }
      : config.deliveryPayment,
    coupons: getArrayOverride(overrides.coupons, config.coupons),
    orders: getArrayOverride(overrides.orders, config.orders),
    customers: getArrayOverride(overrides.customers, config.customers),
  };
}

function getArrayOverride<T>(overrideValue: T[] | undefined, fallback: T[]) {
  if (Array.isArray(overrideValue) && overrideValue.length > 0) {
    return overrideValue;
  }

  return Array.isArray(fallback) ? fallback : [];
}

function mergeCategoryArray(
  overrideValue: StorefrontConfigOverrides["categories"],
  fallback: StorefrontConfig["categories"],
) {
  if (!Array.isArray(overrideValue) || overrideValue.length === 0) {
    return Array.isArray(fallback) ? fallback : [];
  }

  const categoriesById = new Map(
    fallback.map((category) => [category.id, category]),
  );

  overrideValue.forEach((category) => {
    const fallbackCategory =
      fallback.find((item) => item.id === category.id) ??
      fallback.find((item) => item.slug === category.slug);

    const mergedCategory = fallbackCategory
      ? {
          ...fallbackCategory,
          ...category,
          image: getNonEmptyString(category.image) ?? fallbackCategory.image,
          icon: getNonEmptyString(category.icon) ?? fallbackCategory.icon,
          descriptionUk:
            getNonEmptyString(category.descriptionUk) ??
            fallbackCategory.descriptionUk,
          descriptionRu:
            getNonEmptyString(category.descriptionRu) ??
            fallbackCategory.descriptionRu,
          showInCatalogNavigation:
            category.showInCatalogNavigation ??
            fallbackCategory.showInCatalogNavigation,
        }
      : {
          ...category,
          image:
            getNonEmptyString(category.image) ??
            getCategoryFallbackImage(category.slug),
          showInCatalogNavigation: category.showInCatalogNavigation ?? true,
        };

    categoriesById.set(category.id, mergedCategory);
  });

  return Array.from(categoriesById.values()).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0) ||
      a.nameUk.localeCompare(b.nameUk),
  );
}

function mergeProductArray(
  overrideValue: StorefrontConfigOverrides["products"],
  fallback: StorefrontConfig["products"],
) {
  if (!Array.isArray(overrideValue) || overrideValue.length === 0) {
    return Array.isArray(fallback) ? fallback : [];
  }

  return overrideValue.map((product) => {
    const fallbackProduct =
      fallback.find((item) => item.id === product.id) ??
      fallback.find((item) => item.slug === product.slug);
    const normalizedImages = normalizeProductImageUrls(product.images ?? []).filter(
      (imageUrl) => !isUnreliableSeedProductImageUrl(imageUrl),
    );
    const fallbackImages = fallbackProduct
      ? normalizeProductImageUrls(fallbackProduct.images ?? [])
      : [];

    return fallbackProduct
      ? {
          ...fallbackProduct,
          ...product,
          images: normalizedImages.length > 0 ? normalizedImages : fallbackImages,
        }
      : {
          ...product,
          images: normalizedImages,
        };
  });
}

type StorefrontSettingsOverride = NonNullable<StorefrontConfigOverrides["settings"]>;

function mergeSettings(
  settings: StorefrontConfig["settings"],
  override: StorefrontSettingsOverride,
): StorefrontConfig["settings"] {
  return {
    ...settings,
    ...override,
    branding: {
      logoText:
        getNonEmptyString(override.branding?.logoText) ??
        settings.branding?.logoText ??
        getNonEmptyString(override.storeName) ??
        settings.storeName,
      faviconText:
        getNonEmptyString(override.branding?.faviconText) ??
        settings.branding?.faviconText ??
        "R",
      logoAsset:
        getNonEmptyString(override.branding?.logoAsset) ??
        settings.branding?.logoAsset,
      faviconAsset:
        getNonEmptyString(override.branding?.faviconAsset) ??
        settings.branding?.faviconAsset,
    },
    socialLinks: {
      ...settings.socialLinks,
      ...compactStringRecord(override.socialLinks),
    },
    colors: {
      primary: getNonEmptyString(override.colors?.primary) ?? settings.colors.primary,
      secondary:
        getNonEmptyString(override.colors?.secondary) ?? settings.colors.secondary,
      accent: getNonEmptyString(override.colors?.accent) ?? settings.colors.accent,
    },
    visuals: {
      ...settings.visuals,
      ...compactStringRecord(override.visuals),
    },
    heroMediaSlides: getHeroMediaSlidesOverride(
      override.heroMediaSlides,
      settings.heroMediaSlides,
    ),
    hero: normalizeHeroCopy({
      ...settings.hero,
      ...override.hero,
    }),
    promoBanner: {
      ...settings.promoBanner,
      ...override.promoBanner,
    },
    seo: {
      ...settings.seo,
      ...override.seo,
    },
  };
}

function getNonEmptyString(value: string | undefined) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function getHeroMediaSlidesOverride(
  overrideValue: StorefrontSettingsOverride["heroMediaSlides"],
  fallback: StorefrontConfig["settings"]["heroMediaSlides"],
) {
  const fallbackSlides = Array.isArray(fallback) ? fallback : [];

  if (Array.isArray(overrideValue)) {
    const overrideSlides = overrideValue
      .filter((slide) => slide && typeof slide === "object")
      .map((slide, index) => ({
        ...slide,
        sortOrder:
          typeof slide.sortOrder === "number" && Number.isFinite(slide.sortOrder)
            ? slide.sortOrder
            : index,
      }));

    const existingKeys = new Set(
      overrideSlides.map((slide) => `${slide.id}:${slide.imageUrl}`),
    );
    const mergedSlides = [
      ...overrideSlides,
      ...fallbackSlides.filter((slide) => {
        const key = `${slide.id}:${slide.imageUrl}`;
        return !existingKeys.has(key);
      }),
    ];

    return mergedSlides
      .filter((slide) => getNonEmptyString(slide.imageUrl))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return fallbackSlides;
}

function getCategoryFallbackImage(slug: string | undefined) {
  const normalizedSlug = slug?.toLowerCase() ?? "";

  if (normalizedSlug.includes("hair")) {
    return "/visuals/realistic/category-hair.jpg";
  }

  if (normalizedSlug.includes("body") || normalizedSlug.includes("bath")) {
    return "/visuals/realistic/category-body.jpg";
  }

  if (normalizedSlug.includes("wellness") || normalizedSlug.includes("health")) {
    return "/visuals/realistic/category-wellness.jpg";
  }

  return "/visuals/realistic/category-face.jpg";
}

function normalizeHeroCopy(hero: StorefrontConfig["settings"]["hero"]) {
  return {
    ...hero,
    eyebrow: {
      uk: hero.eyebrow.uk.toLowerCase().includes("ecommerce")
        ? "Твій ритм щоденної краси"
        : hero.eyebrow.uk,
      ru: hero.eyebrow.ru.toLowerCase().includes("ecommerce")
        ? "Твой ритм ежедневной красоты"
        : hero.eyebrow.ru,
    },
    title: {
      uk: hero.title.uk.replace("wellness", "здоров'я"),
      ru: hero.title.ru.replace("wellness", "здоровья"),
    },
  };
}

function compactStringRecord<T extends Record<string, string> | undefined>(
  value: T,
) {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => Boolean(item.trim())),
  ) as Partial<NonNullable<T>>;
}
