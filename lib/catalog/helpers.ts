import type { Locale } from "@/lib/i18n/config";
import { getCategoryAndDescendantIds } from "@/lib/catalog/category-tree";
import {
  isProductMerchandisable,
  isProductPublished,
} from "@/lib/catalog/publication";
import { getProductReviewSummary } from "@/lib/catalog/reviews";
import type {
  CatalogCategory,
  Product,
  ProductAttributeDefinition,
  ProductAttributeValue,
  ProductReview,
  ProductVariant,
} from "@/types/store";

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "popular"
  | "rating";

export type AvailabilityFilter = "in-stock" | "out-of-stock";

export type CatalogFilters = {
  q?: string;
  category?: string;
  brand?: string;
  skinType?: string;
  attributes: Record<string, string>;
  availability?: AvailabilityFilter;
  minPrice?: number;
  maxPrice?: number;
  saleOnly?: boolean;
  minRating?: number;
  sort: ProductSort;
  page: number;
};

export function getCategoryName(category: CatalogCategory, locale: Locale) {
  return locale === "uk" ? category.nameUk : category.nameRu;
}

export function getCategoryDescription(
  category: CatalogCategory,
  locale: Locale,
) {
  return locale === "uk" ? category.descriptionUk : category.descriptionRu;
}

export function getProductName(product: Product, locale: Locale) {
  return locale === "uk" ? product.nameUk : product.nameRu;
}

export function getProductShortDescription(product: Product, locale: Locale) {
  return locale === "uk" ? product.shortDescriptionUk : product.shortDescriptionRu;
}

export function getProductDescription(product: Product, locale: Locale) {
  return locale === "uk" ? product.descriptionUk : product.descriptionRu;
}

export function getProductIngredients(product: Product, locale: Locale) {
  return locale === "uk" ? product.ingredientsUk : product.ingredientsRu;
}

export function getProductUsage(product: Product, locale: Locale) {
  return locale === "uk" ? product.usageUk : product.usageRu;
}

export function getProductWarnings(product: Product, locale: Locale) {
  return locale === "uk" ? product.warningsUk : product.warningsRu;
}

export function getProductSeoTitle(product: Product, locale: Locale) {
  return getLocalizedSeoText(product.seo?.title, locale) || getProductName(product, locale);
}

export function getProductSeoMetaDescription(product: Product, locale: Locale) {
  return (
    getLocalizedSeoText(product.seo?.metaDescription, locale) ||
    getProductShortDescription(product, locale) ||
    getProductDescription(product, locale)
  );
}

export function getProductSeoFocusKeyword(product: Product, locale: Locale) {
  return getLocalizedSeoText(product.seo?.focusKeyword, locale);
}

export function getProductSeoKeywordList(product: Product, locale: Locale) {
  return splitSeoList(getLocalizedSeoText(product.seo?.longTailKeywords, locale));
}

export function getProductSeoFeatures(product: Product, locale: Locale) {
  return getLocalizedSeoText(product.seo?.features, locale);
}

export function getProductSeoSuitableFor(product: Product, locale: Locale) {
  return getLocalizedSeoText(product.seo?.suitableFor, locale);
}

export function getProductSeoFaqItems(product: Product, locale: Locale) {
  return (product.seo?.faq ?? [])
    .map((item) => ({
      id: item.id,
      question: getLocalizedSeoText(item.question, locale),
      answer: getLocalizedSeoText(item.answer, locale),
      sortOrder: item.sortOrder,
    }))
    .filter((item) => item.question && item.answer)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProductSeoInternalLinks(product: Product, locale: Locale) {
  return (product.seo?.internalLinks ?? [])
    .map((item) => ({
      id: item.id,
      label: getLocalizedSeoText(item.label, locale) || item.href,
      href: item.href,
      sortOrder: item.sortOrder,
    }))
    .filter((item) => item.href.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProductSeoKeywords(product: Product, locale: Locale) {
  return [
    getProductSeoFocusKeyword(product, locale),
    ...getProductSeoKeywordList(product, locale),
  ].filter((item): item is string => Boolean(item?.trim()));
}

export function getProductBadge(product: Product, locale: Locale) {
  return locale === "uk" ? product.badgeUk : product.badgeRu;
}

export function getProductSalePrice(
  product: Pick<Product, "price" | "salePrice">,
) {
  return typeof product.salePrice === "number" &&
    Number.isFinite(product.salePrice) &&
    product.salePrice > 0 &&
    product.salePrice < product.price
    ? product.salePrice
    : undefined;
}

export function getProductDisplayPrice(
  product: Pick<Product, "price" | "salePrice">,
) {
  return getProductSalePrice(product) ?? product.price;
}

export function isProductDiscounted(
  product: Pick<Product, "price" | "salePrice">,
) {
  return getProductSalePrice(product) !== undefined;
}

export function getProductDiscountPercent(
  product: Pick<Product, "price" | "salePrice">,
) {
  const salePrice = getProductSalePrice(product);

  if (!salePrice || product.price <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(((product.price - salePrice) / product.price) * 100));
}

export function getActiveProductVariants(product: Pick<Product, "variants">) {
  return (product.variants ?? [])
    .filter((variant) => variant.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDefaultProductVariant(product: Pick<Product, "variants">) {
  const variants = getActiveProductVariants(product);

  return variants.find((variant) => variant.isDefault) ?? variants[0];
}

export function getVariantName(variant: ProductVariant, locale: Locale) {
  return locale === "uk" ? variant.labelUk : variant.labelRu;
}

export function getVariantOptionName(variant: ProductVariant, locale: Locale) {
  const explicitName =
    locale === "uk" ? variant.optionNameUk?.trim() : variant.optionNameRu?.trim();

  if (explicitName) {
    return explicitName;
  }

  if (variant.optionType === "color") {
    return locale === "uk" ? "Колір" : "Цвет";
  }

  if (variant.optionType === "scent") {
    return locale === "uk" ? "Аромат" : "Аромат";
  }

  if (variant.optionType === "style") {
    return locale === "uk" ? "Тип" : "Тип";
  }

  return locale === "uk" ? "Варіант" : "Вариант";
}

export function getVariantSalePrice(
  variant: Pick<ProductVariant, "price" | "salePrice">,
) {
  return typeof variant.salePrice === "number" &&
    Number.isFinite(variant.salePrice) &&
    variant.salePrice > 0 &&
    variant.salePrice < variant.price
    ? variant.salePrice
    : undefined;
}

export function getVariantDisplayPrice(
  variant: Pick<ProductVariant, "price" | "salePrice">,
) {
  return getVariantSalePrice(variant) ?? variant.price;
}

export function getAttributeName(
  definition: ProductAttributeDefinition,
  locale: Locale,
) {
  return locale === "uk" ? definition.nameUk : definition.nameRu;
}

export function getAttributeValue(
  attribute: ProductAttributeValue,
  locale: Locale,
) {
  if (locale === "uk" && attribute.valueUk) {
    return attribute.valueUk;
  }

  if (locale === "ru" && attribute.valueRu) {
    return attribute.valueRu;
  }

  return Array.isArray(attribute.value)
    ? attribute.value.join(", ")
    : String(attribute.value);
}

export function formatPrice(value: number) {
  return value.toLocaleString("uk-UA");
}

export function getProductCategory(
  product: Product,
  categories: CatalogCategory[],
) {
  return categories.find((category) => category.id === product.categoryId);
}

export function getProductCountForCategory(
  categoryId: string,
  products: Product[] = [],
) {
  return products.filter(
    (product) =>
      product.categoryId === categoryId && isProductPublished(product),
  ).length;
}

export function getBrands(products: Product[] = []) {
  return Array.from(
    new Set(
      products
        .map((product) => product.brand?.trim())
        .filter((brand): brand is string => Boolean(brand)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function getSkinTypes(products: Product[] | undefined, locale: Locale) {
  const safeProducts = Array.isArray(products) ? products : [];
  const values = safeProducts
    .map((product) =>
      product.attributes.find((attribute) => attribute.definitionId === "skin-type"),
    )
    .filter(Boolean);

  return Array.from(
    new Map(
      values.map((attribute) => [
        String(attribute?.value),
        getAttributeValue(attribute!, locale),
      ]),
    ).entries(),
  );
}

export function getAttributeFilterOptions(
  products: Product[] | undefined,
  definitions: ProductAttributeDefinition[] | undefined,
  locale: Locale,
) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeDefinitions = Array.isArray(definitions) ? definitions : [];

  return safeDefinitions
    .filter((definition) => definition.isFilterable)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((definition) => {
      const values = safeProducts
        .flatMap((product) =>
          product.attributes.filter(
            (attribute) => attribute.definitionId === definition.id,
          ),
        )
        .filter(Boolean);

      const options = Array.from(
        new Map(
          values.map((attribute) => [
            String(attribute.value),
            getAttributeValue(attribute, locale),
          ]),
        ).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1]));

      return { definition, options };
    })
    .filter((item) => item.options.length > 0);
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getNumberParam(value: string | string[] | undefined) {
  const raw = getSingleParam(value);
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getSortParam(value: string | string[] | undefined): ProductSort {
  const raw = getSingleParam(value);
  if (
    raw === "newest" ||
    raw === "price-asc" ||
    raw === "price-desc" ||
    raw === "popular" ||
    raw === "rating"
  ) {
    return raw;
  }

  return "newest";
}

function getAvailabilityParam(
  value: string | string[] | undefined,
): AvailabilityFilter | undefined {
  const raw = getSingleParam(value);
  return raw === "in-stock" || raw === "out-of-stock" ? raw : undefined;
}

export function parseCatalogFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const attributes = Object.fromEntries(
    Object.entries(searchParams)
      .filter(([key, value]) => key.startsWith("attr_") && getSingleParam(value))
      .map(([key, value]) => [
        key.replace(/^attr_/, ""),
        getSingleParam(value)?.trim() ?? "",
      ]),
  );
  const skinType = getSingleParam(searchParams.skinType) || undefined;

  if (skinType && !attributes["skin-type"]) {
    attributes["skin-type"] = skinType;
  }

  return {
    q: getSingleParam(searchParams.q)?.trim() || undefined,
    category: getSingleParam(searchParams.category) || undefined,
    brand: getSingleParam(searchParams.brand) || undefined,
    skinType,
    attributes,
    availability: getAvailabilityParam(searchParams.availability),
    minPrice: getNumberParam(searchParams.minPrice),
    maxPrice: getNumberParam(searchParams.maxPrice),
    saleOnly: getSingleParam(searchParams.sale) === "1",
    minRating: getNumberParam(searchParams.minRating),
    sort: getSortParam(searchParams.sort),
    page: Math.max(1, Math.floor(getNumberParam(searchParams.page) ?? 1)),
  };
}

export function filterProducts(
  products: Product[] | undefined,
  categories: CatalogCategory[] | undefined,
  filters: CatalogFilters,
  locale: Locale,
  attributeDefinitions: ProductAttributeDefinition[] = [],
  productReviews: ProductReview[] = [],
) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeAttributeDefinitions = Array.isArray(attributeDefinitions)
    ? attributeDefinitions
    : [];
  const normalizedQuery = filters.q?.toLowerCase();
  const normalizedScoredQuery = normalizeCatalogSearchText(filters.q);
  const queryTerms = normalizedScoredQuery.split(" ").filter(Boolean);
  const queryScores = new Map<string, number>();
  const selectedCategory = filters.category
    ? safeCategories.find((category) => category.slug === filters.category)
    : undefined;
  const selectedCategoryIds = selectedCategory
    ? new Set(getCategoryAndDescendantIds(safeCategories, selectedCategory.id))
    : undefined;

  return safeProducts
    .filter((product) => isProductPublished(product))
    .filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

      const score = getCatalogQueryScore(
        product,
        safeCategories,
        safeAttributeDefinitions,
        locale,
        normalizedScoredQuery,
        queryTerms,
      );

      if (score > 0) {
        queryScores.set(product.id, score);
      }

      return score > 0;
    })
    .filter((product) =>
      selectedCategoryIds ? selectedCategoryIds.has(product.categoryId) : true,
    )
    .filter((product) => (filters.brand ? product.brand === filters.brand : true))
    .filter((product) =>
      filters.skinType ? product.skinType === filters.skinType : true,
    )
    .filter((product) =>
    Object.entries(filters.attributes ?? {}).every(([slug, selectedValue]) => {
        if (!selectedValue) {
          return true;
        }

        const definition = safeAttributeDefinitions.find(
          (item) => item.slug === slug,
        );

        if (!definition && slug === "skin-type") {
          return product.skinType === selectedValue;
        }

        if (!definition) {
          return true;
        }

        return product.attributes.some(
          (attribute) =>
            attribute.definitionId === definition.id &&
            String(attribute.value) === selectedValue,
        );
      }),
    )
    .filter((product) => {
      if (filters.availability === "in-stock") {
        return product.stock > 0 && product.status === "active";
      }

      if (filters.availability === "out-of-stock") {
        return product.stock === 0 || product.status === "out_of_stock";
      }

      return true;
    })
    .filter((product) =>
      typeof filters.minPrice === "number"
        ? getProductDisplayPrice(product) >= filters.minPrice
        : true,
    )
    .filter((product) =>
      typeof filters.maxPrice === "number"
        ? getProductDisplayPrice(product) <= filters.maxPrice
        : true,
    )
    .filter((product) => (filters.saleOnly ? isProductDiscounted(product) : true))
    .filter((product) => {
      if (typeof filters.minRating !== "number") {
        return true;
      }

      return (
        getProductReviewSummary(productReviews, product.id).averageRating >=
        filters.minRating
      );
    })
    .sort((a, b) => {
      if (normalizedQuery) {
        const relevance = (queryScores.get(b.id) ?? 0) - (queryScores.get(a.id) ?? 0);

        if (relevance !== 0) {
          return relevance;
        }
      }

      if (filters.sort === "price-asc") {
        return getProductDisplayPrice(a) - getProductDisplayPrice(b);
      }

      if (filters.sort === "price-desc") {
        return getProductDisplayPrice(b) - getProductDisplayPrice(a);
      }

      if (filters.sort === "popular") {
        return b.popularity - a.popularity;
      }

      if (filters.sort === "rating") {
        const aSummary = getProductReviewSummary(productReviews, a.id);
        const bSummary = getProductReviewSummary(productReviews, b.id);

        return (
          bSummary.averageRating - aSummary.averageRating ||
          bSummary.reviewCount - aSummary.reviewCount ||
          b.popularity - a.popularity
        );
      }

      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
}

export function getRelatedProducts(
  product: Product,
  products: Product[] = [],
  categories: CatalogCategory[] = [],
  productReviews: ProductReview[] = [],
) {
  const maxRelatedProducts = 36;

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && isProductMerchandisable(candidate),
    )
    .map((candidate) => ({
      product: candidate,
      similarity: getProductSimilarityBasis(product, candidate, categories),
      score: getRelatedProductScore(product, candidate, categories, productReviews),
    }))
    .filter((item) => item.similarity.isSimilar && item.score >= 35)
    .sort((a, b) => {
      const ratingDelta =
        getProductReviewSummary(productReviews, b.product.id).averageRating -
        getProductReviewSummary(productReviews, a.product.id).averageRating;

      return (
        b.score - a.score ||
        ratingDelta ||
        b.product.popularity - a.product.popularity ||
        Date.parse(b.product.createdAt) - Date.parse(a.product.createdAt)
      );
    })
    .slice(0, maxRelatedProducts)
    .map((item) => item.product);
}

export function getSameBrandProducts(
  product: Product,
  products: Product[] = [],
  categories: CatalogCategory[] = [],
  productReviews: ProductReview[] = [],
) {
  const maxBrandProducts = 36;
  const normalizedBrand = normalizeCatalogSearchText(product.brand);

  if (!normalizedBrand) {
    return [];
  }

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        isProductMerchandisable(candidate) &&
        normalizeCatalogSearchText(candidate.brand) === normalizedBrand,
    )
    .map((candidate) => ({
      product: candidate,
      score: getRelatedProductScore(product, candidate, categories, productReviews),
    }))
    .sort((a, b) => {
      const ratingDelta =
        getProductReviewSummary(productReviews, b.product.id).averageRating -
        getProductReviewSummary(productReviews, a.product.id).averageRating;

      return (
        b.score - a.score ||
        ratingDelta ||
        b.product.popularity - a.product.popularity ||
        Date.parse(b.product.createdAt) - Date.parse(a.product.createdAt)
      );
    })
    .slice(0, maxBrandProducts)
    .map((item) => item.product);
}

function getCatalogQueryScore(
  product: Product,
  categories: CatalogCategory[],
  definitions: ProductAttributeDefinition[],
  locale: Locale,
  normalizedQuery: string,
  queryTerms: string[],
) {
  if (!normalizedQuery) {
    return 0;
  }

  const secondaryLocale: Locale = locale === "uk" ? "ru" : "uk";
  const category = getProductCategory(product, categories);
  const categoryTrail = category ? getCategoryAncestors(category, categories) : [];
  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );
  const searchableFields: Array<[string | undefined, number]> = [
    [getProductName(product, locale), 130],
    [getProductName(product, secondaryLocale), 92],
    [product.sku, 108],
    [product.brand, 76],
    [getProductBadge(product, locale), 54],
    [getProductShortDescription(product, locale), 44],
    [getProductShortDescription(product, secondaryLocale), 34],
    [getProductDescription(product, locale), 26],
  ];

  categoryTrail.forEach((trailItem) => {
    searchableFields.push([getCategoryName(trailItem, locale), 68]);
    searchableFields.push([getCategoryName(trailItem, secondaryLocale), 54]);
    searchableFields.push([getCategoryDescription(trailItem, locale), 28]);
  });

  product.attributes.forEach((attribute) => {
    const definition = definitionsById.get(attribute.definitionId);

    if (definition) {
      searchableFields.push([getAttributeName(definition, locale), 44]);
      searchableFields.push([getAttributeName(definition, secondaryLocale), 36]);
      searchableFields.push([definition.slug, 34]);
    }

    searchableFields.push([getAttributeValue(attribute, locale), 46]);
    searchableFields.push([getAttributeValue(attribute, secondaryLocale), 38]);
  });

  const score = searchableFields.reduce(
    (total, [value, weight]) =>
      total + getCatalogTextMatchScore(value, normalizedQuery, queryTerms, weight),
    0,
  );

  return score > 0
    ? score +
        Math.min(product.popularity, 100) / 16 +
        (product.status === "active" && product.stock > 0 ? 10 : -20)
    : 0;
}

function getCatalogTextMatchScore(
  value: string | undefined,
  normalizedQuery: string,
  queryTerms: string[],
  weight: number,
) {
  const normalizedValue = normalizeCatalogSearchText(value);

  if (!normalizedValue) {
    return 0;
  }

  if (normalizedValue === normalizedQuery) {
    return weight;
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return weight * 0.86;
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return weight * 0.68;
  }

  const compactValue = normalizedValue.replace(/\s+/g, "");
  const compactQuery = normalizedQuery.replace(/\s+/g, "");

  if (compactQuery.length >= 3 && compactValue.includes(compactQuery)) {
    return weight * 0.58;
  }

  if (queryTerms.length === 0) {
    return 0;
  }

  const termScore = queryTerms.reduce((total, term) => {
    if (term.length < 2) {
      return total;
    }

    if (normalizedValue.startsWith(term)) {
      return total + weight * 0.52;
    }

    if (normalizedValue.includes(term)) {
      return total + weight * 0.38;
    }

    return total;
  }, 0);

  return termScore / queryTerms.length;
}

function normalizeCatalogSearchText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "'")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLocalizedSeoText(
  value: Partial<Record<Locale, string>> | undefined,
  locale: Locale,
) {
  const localizedValue = value?.[locale]?.trim();
  const fallbackLocale: Locale = locale === "uk" ? "ru" : "uk";

  return localizedValue || value?.[fallbackLocale]?.trim() || "";
}

function splitSeoList(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRelatedProductScore(
  product: Product,
  candidate: Product,
  categories: CatalogCategory[],
  productReviews: ProductReview[],
) {
  let score = 0;
  const similarity = getProductSimilarityBasis(product, candidate, categories);
  const productCategory = getProductCategory(product, categories);
  const candidateCategory = getProductCategory(candidate, categories);
  const productAncestors = productCategory
    ? getCategoryAncestors(productCategory, categories)
    : [];
  const candidateAncestors = candidateCategory
    ? getCategoryAncestors(candidateCategory, categories)
    : [];
  const productAncestorIds = new Set(productAncestors.map((category) => category.id));
  const candidateAncestorIds = new Set(
    candidateAncestors.map((category) => category.id),
  );

  if (candidate.categoryId === product.categoryId) {
    score += 90;
  } else if (candidateAncestorIds.has(product.categoryId)) {
    score += 70;
  } else if (productAncestorIds.has(candidate.categoryId)) {
    score += 58;
  } else if (
    productAncestors.some((category) => candidateAncestorIds.has(category.id))
  ) {
    score += 42;
  }

  if (candidate.brand && candidate.brand === product.brand) {
    score += similarity.isSimilar ? 44 : 16;
  }

  if (candidate.brand && product.brand && candidate.brand !== product.brand) {
    const normalizedBrand = normalizeCatalogSearchText(product.brand);

    score += getCatalogTextMatchScore(
      candidate.brand,
      normalizedBrand,
      normalizedBrand.split(" ").filter(Boolean),
      12,
    );
  }

  if (candidate.skinType && product.skinType && candidate.skinType === product.skinType) {
    score += 18;
  }

  const candidateAttributeMap = new Map(
    candidate.attributes.map((attribute) => [
      attribute.definitionId,
      String(attribute.value),
    ]),
  );

  product.attributes.forEach((attribute) => {
    if (candidateAttributeMap.get(attribute.definitionId) === String(attribute.value)) {
      score += 16;
    }
  });

  score += similarity.sharedTokenScore;

  const productPrice = getProductDisplayPrice(product);
  const candidatePrice = getProductDisplayPrice(candidate);

  if (productPrice > 0 && candidatePrice > 0) {
    const priceRatio = Math.abs(productPrice - candidatePrice) / productPrice;
    score += Math.max(0, 18 - priceRatio * 28);
  }

  if (isProductDiscounted(candidate) === isProductDiscounted(product)) {
    score += 4;
  }

  const reviewSummary = getProductReviewSummary(productReviews, candidate.id);

  score += Math.min(candidate.popularity, 100) / 10;
  score += reviewSummary.averageRating * 2;
  score += Math.min(reviewSummary.reviewCount, 20) / 2;

  if (candidate.status !== "active" || candidate.stock <= 0) {
    score -= 22;
  }

  return score;
}

function getProductSimilarityBasis(
  product: Product,
  candidate: Product,
  categories: CatalogCategory[],
) {
  const productCategory = getProductCategory(product, categories);
  const candidateCategory = getProductCategory(candidate, categories);
  const productAncestors = productCategory
    ? getCategoryAncestors(productCategory, categories)
    : [];
  const candidateAncestors = candidateCategory
    ? getCategoryAncestors(candidateCategory, categories)
    : [];
  const productAncestorIds = new Set(productAncestors.map((category) => category.id));
  const candidateAncestorIds = new Set(
    candidateAncestors.map((category) => category.id),
  );
  const sameCategory = candidate.categoryId === product.categoryId;
  const relatedCategory =
    sameCategory ||
    candidateAncestorIds.has(product.categoryId) ||
    productAncestorIds.has(candidate.categoryId) ||
    productAncestors.some((category) => candidateAncestorIds.has(category.id));
  const sameSkinType = Boolean(
    candidate.skinType && product.skinType && candidate.skinType === product.skinType,
  );
  const candidateAttributeMap = new Map(
    candidate.attributes.map((attribute) => [
      attribute.definitionId,
      String(attribute.value),
    ]),
  );
  const sharedAttributeCount = product.attributes.reduce(
    (count, attribute) =>
      candidateAttributeMap.get(attribute.definitionId) === String(attribute.value)
        ? count + 1
        : count,
    0,
  );
  const sharedTokenScore = getProductTextSimilarityScore(product, candidate);
  const sharedTokenCount = sharedTokenScore / 5;

  return {
    isSimilar:
      relatedCategory ||
      sameSkinType ||
      sharedAttributeCount >= 1 ||
      sharedTokenCount >= 2,
    sharedTokenScore,
  };
}

function getProductTextSimilarityScore(product: Product, candidate: Product) {
  const productTokens = new Set(getProductSimilarityTokens(product));
  const candidateTokens = new Set(getProductSimilarityTokens(candidate));

  if (productTokens.size === 0 || candidateTokens.size === 0) {
    return 0;
  }

  let sharedTokens = 0;

  productTokens.forEach((token) => {
    if (candidateTokens.has(token)) {
      sharedTokens += 1;
    }
  });

  return Math.min(46, sharedTokens * 5);
}

function getProductSimilarityTokens(product: Product) {
  const source = [
    product.nameUk,
    product.nameRu,
    product.shortDescriptionUk,
    product.shortDescriptionRu,
    product.descriptionUk,
    product.descriptionRu,
    product.brand,
    product.skinType,
    product.badgeUk,
    product.badgeRu,
    product.seo?.title?.uk,
    product.seo?.title?.ru,
    product.seo?.metaDescription?.uk,
    product.seo?.metaDescription?.ru,
    product.seo?.focusKeyword?.uk,
    product.seo?.focusKeyword?.ru,
    product.seo?.longTailKeywords?.uk,
    product.seo?.longTailKeywords?.ru,
    product.seo?.features?.uk,
    product.seo?.features?.ru,
    product.seo?.suitableFor?.uk,
    product.seo?.suitableFor?.ru,
    ...(product.seo?.faq ?? []).flatMap((item) => [
      item.question.uk ?? "",
      item.question.ru ?? "",
      item.answer.uk ?? "",
      item.answer.ru ?? "",
    ]),
    ...product.attributes.flatMap((attribute) => [
      String(attribute.value),
      attribute.valueUk ?? "",
      attribute.valueRu ?? "",
    ]),
  ].join(" ");

  return normalizeCatalogSearchText(source)
    .split(" ")
    .filter((token) => token.length >= 4 && !RELATED_STOP_WORDS.has(token));
}

const RELATED_STOP_WORDS = new Set([
  "для",
  "та",
  "або",
  "після",
  "шкіри",
  "кожи",
  "крем",
  "засіб",
  "средство",
  "уход",
  "догляд",
  "ежедневный",
  "щоденний",
]);

function getCategoryAncestors(
  category: CatalogCategory,
  categories: CatalogCategory[],
) {
  const ancestors = [category];
  const visited = new Set([category.id]);
  let current = category;

  while (current.parentId) {
    const parent = categories.find((item) => item.id === current.parentId);

    if (!parent || visited.has(parent.id)) {
      break;
    }

    ancestors.push(parent);
    visited.add(parent.id);
    current = parent;
  }

  return ancestors;
}
