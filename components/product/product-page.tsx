import Link from "next/link";
import { ArrowLeft, ChevronDown, ShieldCheck } from "lucide-react";

import { ProductDetailShell } from "@/components/product/product-detail-shell";
import {
  ProductComboOffers,
  type ProductComboDisplayOffer,
} from "@/components/product/product-combo-offers";
import { ProductReviews } from "@/components/product/product-reviews";
import { RelatedProductsCarousel } from "@/components/product/related-products-carousel";
import { Button } from "@/components/ui/button";
import {
  getAttributeName,
  getAttributeValue,
  getCategoryName,
  getProductCategory,
  getProductDescription,
  getProductDisplayPrice,
  getProductIngredients,
  getProductUsage,
  getProductWarnings,
  getProductSeoFaqItems,
  getProductSeoFeatures,
  getProductSeoInternalLinks,
  getProductSeoMetaDescription,
  getProductSeoSuitableFor,
  getProductSeoTitle,
} from "@/lib/catalog/helpers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import { isProductMerchandisable } from "@/lib/catalog/publication";
import { getProductReviewSummary } from "@/lib/catalog/reviews";
import { getComboOfferTargetIds } from "@/lib/catalog/combo-offers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductPreview,
  ProductReview,
} from "@/types/store";

type ProductPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  product: ProductPreview;
  categories?: CategoryPreview[];
  attributeDefinitions?: ProductAttributeDefinition[];
  relatedProducts?: ProductPreview[];
  sameBrandProducts?: ProductPreview[];
  allProducts?: ProductPreview[];
  productReviews?: ProductReview[];
};

export function ProductPage({
  locale,
  dictionary,
  product,
  categories = [],
  attributeDefinitions = [],
  relatedProducts = [],
  sameBrandProducts = [],
  allProducts = [],
  productReviews = [],
}: ProductPageProps) {
  const category = getProductCategory(product, categories);
  const brandSectionTitle = getBrandSectionTitle(product.brand, locale);
  const seoFeatures = getProductSeoFeatures(product, locale);
  const seoSuitableFor = getProductSeoSuitableFor(product, locale);
  const seoFaqItems = getProductSeoFaqItems(product, locale);
  const seoInternalLinks = getProductSeoInternalLinks(product, locale);
  const comboOffers = getProductComboOffers(
    product,
    allProducts,
  );
  const structuredData =
    product.seo?.schemaEnabled === false
      ? undefined
      : getProductStructuredData(product, locale, productReviews);

  return (
    <div className="bg-background">
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/catalog`}>
              <ArrowLeft />
              {dictionary.navigation.catalog}
            </Link>
          </Button>
        </div>
      </section>
      <ProductDetailShell
        locale={locale}
        dictionary={dictionary}
        product={product}
        categoryName={
          category ? getCategoryName(category, locale) : dictionary.product.category
        }
        productReviews={productReviews}
      />
      <ProductComboOffers
        locale={locale}
        dictionary={dictionary}
        product={product}
        offers={comboOffers}
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <ProductInfoAccordion
          sections={[
            {
              title: dictionary.product.details,
              text: getProductDescription(product, locale),
            },
            {
              title: dictionary.product.ingredients,
              text: getProductIngredients(product, locale),
            },
            {
              title: dictionary.product.usage,
              text: getProductUsage(product, locale),
            },
            {
              title: dictionary.product.warnings,
              text: getProductWarnings(product, locale),
            },
            {
              title:
                locale === "uk"
                  ? "Переваги продукту"
                  : "Преимущества продукта",
              text: seoFeatures,
            },
            {
              title:
                locale === "uk"
                  ? "Кому підходить"
                  : "Кому подходит",
              text: seoSuitableFor,
            },
          ]}
          faqItems={seoFaqItems}
        />
        <aside className="grid content-start gap-4">
          <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">
              {dictionary.product.attributes}
            </h2>
            <dl className="mt-5 grid gap-3">
              {(product.attributes ?? []).map((attribute) => {
                const definition = attributeDefinitions.find(
                  (item) => item.id === attribute.definitionId,
                );

                if (!definition) {
                  return null;
                }

                return (
                  <div
                    key={`${attribute.definitionId}-${String(attribute.value)}`}
                    className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm last:border-b-0 last:pb-0"
                  >
                    <dt className="font-medium text-muted-foreground">
                      {getAttributeName(definition, locale)}
                    </dt>
                    <dd className="text-right font-semibold text-foreground">
                      {getAttributeValue(attribute, locale)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
          <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {dictionary.product.delivery}
              </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {dictionary.product.deliveryText}
            </p>
          </article>
          {seoInternalLinks.length > 0 ? (
            <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "uk" ? "Корисні посилання" : "Полезные ссылки"}
              </h2>
              <div className="mt-4 grid gap-2">
                {seoInternalLinks.map((link) => (
                  <Button
                    key={link.id}
                    asChild
                    variant="outline"
                    className="justify-start"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            </article>
          ) : null}
        </aside>
      </section>
      <ProductReviews
        productId={product.id}
        locale={locale}
        initialReviews={productReviews}
      />
      <RelatedProductsCarousel
        locale={locale}
        dictionary={dictionary}
        title={dictionary.product.relatedProducts}
        products={relatedProducts}
        reviews={productReviews}
      />
      <RelatedProductsCarousel
        locale={locale}
        dictionary={dictionary}
        title={brandSectionTitle}
        products={sameBrandProducts}
        reviews={productReviews}
      />
    </div>
  );
}

function getProductComboOffers(
  product: ProductPreview,
  allProducts: ProductPreview[],
): ProductComboDisplayOffer[] {
  const candidates = new Map(
    allProducts
      .filter(
        (candidate) =>
          candidate.id !== product.id && isProductMerchandisable(candidate),
      )
      .map((candidate) => [candidate.id, candidate]),
  );
  const manualOffers = (product.comboOffers ?? [])
    .filter((offer) => offer.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((offer) => {
      const targetProducts = getComboOfferTargetIds(offer)
        .map((targetProductId) => candidates.get(targetProductId))
        .filter((targetProduct): targetProduct is ProductPreview =>
          Boolean(targetProduct),
        );

      if (targetProducts.length === 0) {
        return [];
      }

      return [
        {
          ...offer,
          targetProduct: targetProducts[0],
          targetProducts,
        },
      ];
    });

  return manualOffers;
}

function getBrandSectionTitle(brand: string | undefined, locale: Locale) {
  if (brand) {
    return locale === "uk" ? `Ще від ${brand}` : `Еще от ${brand}`;
  }

  return locale === "uk" ? "Товари цього бренду" : "Товары этого бренда";
}

function ProductInfoAccordion({
  sections,
  faqItems,
}: {
  sections: Array<{ title: string; text: string }>;
  faqItems?: Array<{ id: string; question: string; answer: string }>;
}) {
  const visibleSections = sections.filter((section) => section.text.trim());
  const visibleFaqItems = faqItems ?? [];

  return (
    <div className="grid content-start gap-3">
      {visibleSections.map((section, index) => (
        <details
          key={section.title}
          open={index === 0}
          className="group rounded-lg border border-border bg-card shadow-sm"
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-bold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>{section.title}</span>
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform group-open:rotate-180">
              <ChevronDown className="size-4" />
            </span>
          </summary>
          <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6">
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {section.text}
            </p>
          </div>
        </details>
      ))}
      {visibleFaqItems.length > 0 ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            {visibleFaqItems.length > 1 ? "FAQ" : "FAQ"}
          </h2>
          <div className="mt-4 grid gap-3">
            {visibleFaqItems.map((item) => (
              <details
                key={item.id}
                className="group rounded-lg border border-border bg-background"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left text-sm font-bold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform group-open:rotate-180">
                    <ChevronDown className="size-4" />
                  </span>
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function getProductStructuredData(
  product: ProductPreview,
  locale: Locale,
  productReviews: ProductReview[],
) {
  const reviewSummary = getProductReviewSummary(productReviews, product.id);
  const price = getProductDisplayPrice(product);
  const image = getPrimaryProductImage(product);
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: getProductSeoTitle(product, locale),
    description: getProductSeoMetaDescription(product, locale),
    sku: product.sku,
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    image: image ? [image] : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price,
      availability:
        product.status === "active" && product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `/${locale}/products/${product.slug}`,
    },
  };

  if (reviewSummary.reviewCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewSummary.averageRating.toFixed(1),
      reviewCount: reviewSummary.reviewCount,
    };
  }

  const faqItems = getProductSeoFaqItems(product, locale);

  if (faqItems.length > 0) {
    structuredData.mainEntity = faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }));
  }

  return structuredData;
}
