import { Fragment } from "react";

import { BeautyAtmosphereSection } from "@/components/home/beauty-atmosphere-section";
import { BenefitsSection } from "@/components/home/benefits-section";
import { DeliveryInfoSection } from "@/components/home/delivery-info-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { HeroSection } from "@/components/home/hero-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { ProductCarouselSection } from "@/components/home/product-carousel-section";
import { PromoBanner } from "@/components/home/promo-banner";
import { ReviewsSection } from "@/components/home/reviews-section";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  BenefitItem,
  CategoryPreview,
  DeliveryInfoItem,
  HomepageSection,
  ProductPreview,
  ProductReview,
  ReviewItem,
  SiteSettings,
} from "@/types/store";

type HomePageProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: SiteSettings;
  sections?: HomepageSection[];
  categories?: CategoryPreview[];
  products?: ProductPreview[];
  productReviews?: ProductReview[];
  benefits?: BenefitItem[];
  reviews?: ReviewItem[];
  deliveryInfo?: DeliveryInfoItem[];
};

export function HomePage({
  locale,
  dictionary,
  settings,
  sections = [],
  categories = [],
  products = [],
  productReviews = [],
  benefits = [],
  reviews = [],
  deliveryInfo = [],
}: HomePageProps) {
  const visibleSections = sections
    .filter((section) => section.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <HeroSection
                key={section.id}
                locale={locale}
                dictionary={dictionary}
                settings={settings}
                categories={categories}
              />
            );
          case "featuredCategories":
            return (
              <FeaturedCategories
                key={section.id}
                locale={locale}
                dictionary={dictionary}
                categories={categories}
                products={products}
              />
            );
          case "productCarousel":
            return (
              <ProductCarouselSection
                key={section.id}
                locale={locale}
                dictionary={dictionary}
                section={section}
                categories={categories}
                products={products}
                productReviews={productReviews}
              />
            );
          case "promoBanner":
            return (
              <PromoBanner
                key={section.id}
                locale={locale}
                settings={settings}
              />
            );
          case "benefits":
            return (
              <Fragment key={section.id}>
                <BenefitsSection
                  locale={locale}
                  dictionary={dictionary}
                  benefits={benefits}
                />
                <BeautyAtmosphereSection
                  locale={locale}
                  dictionary={dictionary}
                  settings={settings}
                />
              </Fragment>
            );
          case "reviews":
            return (
              <ReviewsSection
                key={section.id}
                locale={locale}
                dictionary={dictionary}
                reviews={reviews}
              />
            );
          case "deliveryInfo":
            return (
              <DeliveryInfoSection
                key={section.id}
                locale={locale}
                dictionary={dictionary}
                deliveryInfo={deliveryInfo}
              />
            );
          case "newsletter":
            return (
              <NewsletterSection
                key={section.id}
                locale={locale}
                dictionary={dictionary}
                settings={settings}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
