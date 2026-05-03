import type { Locale } from "@/lib/i18n/config";

export type LocalizedText = Record<Locale, string>;

export type VisualTone = "rose" | "sage" | "cream" | "linen";

export type HeroMediaSlide = {
  id: string;
  imageUrl: string;
  title: LocalizedText;
  linkType: "custom" | "product";
  href?: string;
  productSlug?: string;
  isActive: boolean;
  sortOrder: number;
};

export type ProductStatus = "active" | "draft" | "out_of_stock";
export type ProductPublicationStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "archived";

export type AttributeType = "text" | "number" | "boolean" | "select" | "multiselect";

export type Supplier = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  novaPoshtaWarehouse: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  supplierApiKey?: string;
  supplierTelegram?: string;
  supplierViber?: string;
  supplierPaymentInfo?: string;
  supplierCommissionType?: "percent" | "fixed";
  supplierCommissionValue?: number;
};

export type ProductAttributeDefinition = {
  id: string;
  slug: string;
  nameUk: string;
  nameRu: string;
  type: AttributeType;
  isFilterable: boolean;
  categoryIds?: string[];
  sortOrder: number;
};

export type ProductAttributeValue = {
  definitionId: string;
  value: string | number | boolean | string[];
  valueUk?: string;
  valueRu?: string;
};

export type ProductVariant = {
  id: string;
  optionType?: "size" | "color" | "scent" | "style" | "other";
  optionNameUk?: string;
  optionNameRu?: string;
  labelUk: string;
  labelRu: string;
  colorHex?: string;
  sku?: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ProductComboOffer = {
  id: string;
  targetProductId: string;
  targetProductIds?: string[];
  titleUk?: string;
  titleRu?: string;
  descriptionUk?: string;
  descriptionRu?: string;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
};

export type ProductSeoFaq = {
  id: string;
  question: Partial<LocalizedText>;
  answer: Partial<LocalizedText>;
  sortOrder: number;
};

export type ProductSeoInternalLink = {
  id: string;
  label: Partial<LocalizedText>;
  href: string;
  sortOrder: number;
};

export type ProductSeo = {
  title?: Partial<LocalizedText>;
  metaDescription?: Partial<LocalizedText>;
  focusKeyword?: Partial<LocalizedText>;
  longTailKeywords?: Partial<LocalizedText>;
  features?: Partial<LocalizedText>;
  suitableFor?: Partial<LocalizedText>;
  faq?: ProductSeoFaq[];
  internalLinks?: ProductSeoInternalLink[];
  schemaEnabled?: boolean;
  searchBoost?: number;
  pinInSearch?: boolean;
};

export type CatalogCategory = {
  id: string;
  parentId?: string;
  nameUk: string;
  nameRu: string;
  slug: string;
  descriptionUk: string;
  descriptionRu: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  showInHeader: boolean;
  showOnHomepage: boolean;
  showInCatalogNavigation?: boolean;
  tone: VisualTone;
};

export type Product = {
  id: string;
  nameUk: string;
  nameRu: string;
  slug: string;
  shortDescriptionUk: string;
  shortDescriptionRu: string;
  descriptionUk: string;
  descriptionRu: string;
  price: number;
  salePrice?: number;
  stock: number;
  sku: string;
  brand: string;
  categoryId: string;
  supplierId?: string;
  supplierName?: string;
  images: string[];
  ingredientsUk: string;
  ingredientsRu: string;
  usageUk: string;
  usageRu: string;
  warningsUk: string;
  warningsRu: string;
  skinType?: string;
  status: ProductStatus;
  publicationStatus?: ProductPublicationStatus;
  popularity: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  priceUpdatedAt?: string;
  badgeUk?: string;
  badgeRu?: string;
  tone: VisualTone;
  attributes: ProductAttributeValue[];
  variants?: ProductVariant[];
  comboOffers?: ProductComboOffer[];
  seo?: ProductSeo;
};

export type ProductReviewStatus = "pending" | "approved" | "rejected";
export type ProductFeedbackType = "review" | "question";

export type ProductFeedbackReply = {
  id: string;
  reviewId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  comment: string;
  status: ProductReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductReview = {
  id: string;
  productId: string;
  customerId?: string;
  type?: ProductFeedbackType;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  rating?: number;
  comment: string;
  adminReply?: string;
  adminRepliedAt?: string;
  status: ProductReviewStatus;
  isVerifiedPurchase: boolean;
  replies?: ProductFeedbackReply[];
  createdAt: string;
  updatedAt: string;
};

export type SiteSettings = {
  storeName: string;
  branding?: {
    logoText: string;
    faviconText: string;
    logoAsset?: string;
    faviconAsset?: string;
  };
  slogan: LocalizedText;
  description: LocalizedText;
  contactPhone: string;
  contactEmail: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    telegram?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  visuals?: {
    heroImage?: string;
    promoImage?: string;
    wellnessImage?: string;
    sectionImage?: string;
    newsletterImage?: string;
  };
  heroMediaSlides?: HeroMediaSlide[];
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    ctaText: LocalizedText;
    secondaryCtaText: LocalizedText;
  };
  promoBanner: {
    title: LocalizedText;
    text: LocalizedText;
    ctaText: LocalizedText;
  };
  footerText: LocalizedText;
  seo: {
    title: LocalizedText;
    description: LocalizedText;
  };
};

export type HomepageSectionType =
  | "hero"
  | "featuredCategories"
  | "productCarousel"
  | "promoBanner"
  | "benefits"
  | "reviews"
  | "deliveryInfo"
  | "newsletter";

export type HomepageSection = {
  id: string;
  type: HomepageSectionType;
  isVisible: boolean;
  sortOrder: number;
  variant?: "bestSellers" | "newArrivals";
  title?: Partial<LocalizedText>;
  config?: {
    productSource?: "bestSellers" | "newArrivals" | "manual" | "category";
    productIds?: string[];
    categoryId?: string;
    limit?: number;
  };
};

export type BenefitItem = {
  id: string;
  title: LocalizedText;
  text: LocalizedText;
};

export type ReviewItem = {
  id: string;
  author: string;
  city: LocalizedText;
  rating: number;
  text: LocalizedText;
};

export type DeliveryInfoItem = {
  id: string;
  title: LocalizedText;
  text: LocalizedText;
};

export type CategoryPreview = CatalogCategory;
export type ProductPreview = Product;
