import {
  getAttributeName,
  getAttributeValue,
  getCategoryDescription,
  getCategoryName,
  getProductBadge,
  getProductCategory,
  getProductDescription,
  getProductIngredients,
  getProductName,
  getProductSeoFaqItems,
  getProductSeoFeatures,
  getProductSeoFocusKeyword,
  getProductSeoKeywordList,
  getProductSeoMetaDescription,
  getProductSeoSuitableFor,
  getProductSeoTitle,
  getProductShortDescription,
  getProductUsage,
} from "@/lib/catalog/helpers";
import { isProductPublished } from "@/lib/catalog/publication";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductPreview,
} from "@/types/store";

export type ProductSearchResult = {
  product: ProductPreview;
  score: number;
  matchedFields: string[];
};

type SearchProductsOptions = {
  query: string;
  locale: Locale;
  products?: ProductPreview[];
  categories?: CategoryPreview[];
  attributeDefinitions?: ProductAttributeDefinition[];
  limit?: number;
};

type MatchWeights = {
  exact: number;
  startsWith: number;
  includes: number;
  terms: number;
};

const LOCALIZED_NAME_WEIGHTS: MatchWeights = {
  exact: 140,
  startsWith: 110,
  includes: 90,
  terms: 76,
};

const SECONDARY_NAME_WEIGHTS: MatchWeights = {
  exact: 96,
  startsWith: 76,
  includes: 58,
  terms: 48,
};

const SKU_WEIGHTS: MatchWeights = {
  exact: 118,
  startsWith: 94,
  includes: 72,
  terms: 60,
};

const BRAND_WEIGHTS: MatchWeights = {
  exact: 82,
  startsWith: 66,
  includes: 48,
  terms: 40,
};

const CATEGORY_WEIGHTS: MatchWeights = {
  exact: 74,
  startsWith: 58,
  includes: 42,
  terms: 34,
};

const ATTRIBUTE_WEIGHTS: MatchWeights = {
  exact: 62,
  startsWith: 48,
  includes: 36,
  terms: 30,
};

const BODY_WEIGHTS: MatchWeights = {
  exact: 44,
  startsWith: 34,
  includes: 24,
  terms: 20,
};

export function normalizeSearchQuery(value: string) {
  return normalizeSearchText(value);
}

export function searchProducts({
  query,
  locale,
  products = [],
  categories = [],
  attributeDefinitions = [],
  limit,
}: SearchProductsOptions): ProductSearchResult[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryTerms = normalizedQuery.split(" ").filter(Boolean);
  const secondaryLocale: Locale = locale === "uk" ? "ru" : "uk";
  const definitionsById = new Map(
    attributeDefinitions.map((definition) => [definition.id, definition]),
  );

  const results = products
    .filter((product) => isProductPublished(product))
    .map((product) => {
      let score = 0;
      const matchedFields = new Set<string>();

      function addMatch(
        value: string | undefined,
        field: string,
        weights: MatchWeights,
      ) {
        const valueScore = scoreText(value, normalizedQuery, queryTerms, weights);

        if (valueScore > 0) {
          score += valueScore;
          matchedFields.add(field);
        }
      }

      addMatch(getProductName(product, locale), "name", LOCALIZED_NAME_WEIGHTS);
      addMatch(
        getProductName(product, secondaryLocale),
        "secondary-name",
        SECONDARY_NAME_WEIGHTS,
      );
      addMatch(getProductSeoTitle(product, locale), "seo-title", LOCALIZED_NAME_WEIGHTS);
      addMatch(
        getProductSeoMetaDescription(product, locale),
        "seo-description",
        BODY_WEIGHTS,
      );
      addMatch(
        getProductSeoFocusKeyword(product, locale),
        "focus-keyword",
        BRAND_WEIGHTS,
      );
      addMatch(product.sku, "sku", SKU_WEIGHTS);
      addMatch(product.brand, "brand", BRAND_WEIGHTS);
      addMatch(getProductBadge(product, locale), "badge", ATTRIBUTE_WEIGHTS);
      addMatch(
        getProductShortDescription(product, locale),
        "description",
        BODY_WEIGHTS,
      );
      addMatch(
        getProductShortDescription(product, secondaryLocale),
        "secondary-description",
        BODY_WEIGHTS,
      );
      addMatch(getProductDescription(product, locale), "description", BODY_WEIGHTS);
      addMatch(getProductIngredients(product, locale), "ingredients", BODY_WEIGHTS);
      addMatch(getProductUsage(product, locale), "usage", BODY_WEIGHTS);
      addMatch(getProductSeoFeatures(product, locale), "features", BODY_WEIGHTS);
      addMatch(getProductSeoSuitableFor(product, locale), "suitable-for", BODY_WEIGHTS);

      getProductSeoKeywordList(product, locale).forEach((keyword) => {
        addMatch(keyword, "long-tail-keyword", ATTRIBUTE_WEIGHTS);
      });

      getProductSeoFaqItems(product, locale).forEach((faqItem) => {
        addMatch(faqItem.question, "faq", BODY_WEIGHTS);
        addMatch(faqItem.answer, "faq", BODY_WEIGHTS);
      });

      const category = getProductCategory(product, categories);

      if (category) {
        getCategoryTrail(category, categories).forEach((trailItem) => {
          addMatch(getCategoryName(trailItem, locale), "category", CATEGORY_WEIGHTS);
          addMatch(
            getCategoryName(trailItem, secondaryLocale),
            "category",
            CATEGORY_WEIGHTS,
          );
          addMatch(
            getCategoryDescription(trailItem, locale),
            "category-description",
            BODY_WEIGHTS,
          );
        });
      }

      product.attributes.forEach((attribute) => {
        const definition = definitionsById.get(attribute.definitionId);

        if (definition) {
          addMatch(getAttributeName(definition, locale), "attribute", ATTRIBUTE_WEIGHTS);
          addMatch(
            getAttributeName(definition, secondaryLocale),
            "attribute",
            ATTRIBUTE_WEIGHTS,
          );
          addMatch(definition.slug, "attribute", ATTRIBUTE_WEIGHTS);
        }

        addMatch(getAttributeValue(attribute, locale), "attribute", ATTRIBUTE_WEIGHTS);
        addMatch(
          getAttributeValue(attribute, secondaryLocale),
          "attribute",
          ATTRIBUTE_WEIGHTS,
        );
      });

      getProductKeywords(product).forEach((keyword) => {
        addMatch(keyword, "keyword", ATTRIBUTE_WEIGHTS);
      });

      if (score > 0) {
        score += getProductAvailabilityBonus(product);
        score += Math.min(product.popularity, 100) / 20;
        score += getProductSearchBoost(product);
      }

      return {
        product,
        score,
        matchedFields: Array.from(matchedFields),
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      return (
        Number(Boolean(b.product.seo?.pinInSearch)) -
          Number(Boolean(a.product.seo?.pinInSearch)) ||
        b.score - a.score ||
        b.product.popularity - a.product.popularity ||
        Date.parse(b.product.createdAt) - Date.parse(a.product.createdAt)
      );
    });

  return typeof limit === "number" ? results.slice(0, limit) : results;
}

function normalizeSearchText(value: string | undefined) {
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

function scoreText(
  value: string | undefined,
  normalizedQuery: string,
  queryTerms: string[],
  weights: MatchWeights,
) {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue) {
    return 0;
  }

  if (normalizedValue === normalizedQuery) {
    return weights.exact;
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return weights.startsWith;
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return weights.includes;
  }

  const compactValue = normalizedValue.replace(/\s+/g, "");
  const compactQuery = normalizedQuery.replace(/\s+/g, "");

  if (
    compactQuery.length >= 3 &&
    compactValue.length > compactQuery.length &&
    compactValue.includes(compactQuery)
  ) {
    return Math.round(weights.includes * 0.86);
  }

  if (
    queryTerms.length > 1 &&
    queryTerms.every((term) => normalizedValue.includes(term))
  ) {
    return weights.terms;
  }

  if (queryTerms.length > 0) {
    const matchedTermScore = queryTerms.reduce((total, term) => {
      if (term.length < 2) {
        return total;
      }

      if (normalizedValue.startsWith(term)) {
        return total + weights.terms;
      }

      if (normalizedValue.includes(term)) {
        return total + Math.round(weights.terms * 0.72);
      }

      if (isNearTextMatch(normalizedValue, term)) {
        return total + Math.round(weights.terms * 0.42);
      }

      return total;
    }, 0);

    if (matchedTermScore > 0) {
      return Math.round(matchedTermScore / queryTerms.length);
    }
  }

  return 0;
}

function isNearTextMatch(value: string, term: string) {
  if (term.length < 4) {
    return false;
  }

  return value
    .split(" ")
    .some((word) => word.length >= 4 && getLevenshteinDistance(word, term) <= 1);
}

function getLevenshteinDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length] ?? 0;
}

function getProductAvailabilityBonus(product: ProductPreview) {
  return product.status === "active" && product.stock > 0 ? 8 : -12;
}

function getProductSearchBoost(product: ProductPreview) {
  const boost = product.seo?.searchBoost;

  return typeof boost === "number" && Number.isFinite(boost)
    ? Math.max(0, Math.min(boost, 100))
    : 0;
}

function getCategoryTrail(
  category: CategoryPreview,
  categories: CategoryPreview[],
) {
  const trail: CategoryPreview[] = [category];
  const visited = new Set([category.id]);
  let current = category;

  while (current.parentId) {
    const parent = categories.find((item) => item.id === current.parentId);

    if (!parent || visited.has(parent.id)) {
      break;
    }

    trail.push(parent);
    visited.add(parent.id);
    current = parent;
  }

  return trail;
}

function getProductKeywords(product: ProductPreview) {
  const productWithKeywords = product as ProductPreview & {
    keywords?: string[] | string;
  };

  if (Array.isArray(productWithKeywords.keywords)) {
    return [...productWithKeywords.keywords, ...getProductSeoKeywords(product)];
  }

  if (typeof productWithKeywords.keywords === "string") {
    return [productWithKeywords.keywords, ...getProductSeoKeywords(product)];
  }

  return getProductSeoKeywords(product);
}

function getProductSeoKeywords(product: ProductPreview) {
  return [
    product.seo?.focusKeyword?.uk,
    product.seo?.focusKeyword?.ru,
    product.seo?.longTailKeywords?.uk,
    product.seo?.longTailKeywords?.ru,
    product.seo?.features?.uk,
    product.seo?.features?.ru,
    product.seo?.suitableFor?.uk,
    product.seo?.suitableFor?.ru,
  ].filter((item): item is string => Boolean(item?.trim()));
}
