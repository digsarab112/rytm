import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

import {
  AttributeType,
  CouponDiscountType,
  FeedbackType,
  PrismaClient,
  ProductPublicationStatus,
  ProductStatus,
  ReviewStatus,
  VisualTone,
} from "../lib/generated/prisma/client";
import { getDefaultDeliveryPaymentSettings } from "../lib/admin/default-settings";
import { getComboOfferTargetIds } from "../lib/catalog/combo-offers";
import {
  getDefaultStorefrontConfig,
  mergeStorefrontConfig,
} from "../lib/platform/storefront-config";
import type { StorefrontConfigOverrides } from "../types/platform";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

const seedConfig = loadSeedStorefrontConfig();
const {
  attributeDefinitions,
  categories,
  coupons,
  deliveryInfo,
  homepageSections,
  productReviews,
  products,
  settings: siteSettings,
  suppliers,
} = seedConfig;

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or DIRECT_URL is required to seed the PostgreSQL database.",
  );
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

function loadSeedStorefrontConfig() {
  const fallback = getDefaultStorefrontConfig();
  const overridesPath = join(process.cwd(), ".data", "storefront-overrides.json");

  if (!existsSync(overridesPath)) {
    return fallback;
  }

  try {
    const overrides = JSON.parse(
      readFileSync(overridesPath, "utf8"),
    ) as StorefrontConfigOverrides;

    return mergeStorefrontConfig(fallback, overrides);
  } catch (error) {
    console.warn("Could not read .data storefront overrides for seed.", error);
    return fallback;
  }
}

async function main() {
  await seedSuppliers();
  await seedCategories();
  await seedAttributes();
  await seedProducts();
  await seedSiteSettings();
  await seedSiteVisuals();
  await seedHeroMediaSlides();
  await seedHomepageSections();
  await seedMenuAndFooter();
  await seedDeliveryPaymentSettings();
  await seedCoupons();
  await seedProductFeedback();

  console.log("Database seed completed.");
}

async function seedSuppliers() {
  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: {
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        city: supplier.city,
        novaPoshtaWarehouse: supplier.novaPoshtaWarehouse,
        notes: supplier.notes,
        isActive: supplier.isActive,
        supplierApiKey: supplier.supplierApiKey,
        supplierTelegram: supplier.supplierTelegram,
        supplierViber: supplier.supplierViber,
        supplierPaymentInfo: supplier.supplierPaymentInfo,
        supplierCommissionType: supplier.supplierCommissionType,
        supplierCommissionValue: supplier.supplierCommissionValue,
      },
      create: {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        city: supplier.city,
        novaPoshtaWarehouse: supplier.novaPoshtaWarehouse,
        notes: supplier.notes,
        isActive: supplier.isActive,
        supplierApiKey: supplier.supplierApiKey,
        supplierTelegram: supplier.supplierTelegram,
        supplierViber: supplier.supplierViber,
        supplierPaymentInfo: supplier.supplierPaymentInfo,
        supplierCommissionType: supplier.supplierCommissionType,
        supplierCommissionValue: supplier.supplierCommissionValue,
      },
    });
  }
}

async function seedCategories() {
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.parentId && !b.parentId) {
      return 1;
    }

    if (!a.parentId && b.parentId) {
      return -1;
    }

    return a.sortOrder - b.sortOrder;
  });

  for (const category of sortedCategories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        parentId: category.parentId,
        slug: category.slug,
        nameUk: category.nameUk,
        nameRu: category.nameRu,
        descriptionUk: category.descriptionUk,
        descriptionRu: category.descriptionRu,
        icon: category.icon,
        imageUrl: category.image,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        showInHeader: category.showInHeader,
        showOnHomepage: category.showOnHomepage,
        showInCatalogNavigation: category.showInCatalogNavigation ?? true,
        tone: toVisualTone(category.tone),
      },
      create: {
        id: category.id,
        parentId: category.parentId,
        slug: category.slug,
        nameUk: category.nameUk,
        nameRu: category.nameRu,
        descriptionUk: category.descriptionUk,
        descriptionRu: category.descriptionRu,
        icon: category.icon,
        imageUrl: category.image,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        showInHeader: category.showInHeader,
        showOnHomepage: category.showOnHomepage,
        showInCatalogNavigation: category.showInCatalogNavigation ?? true,
        tone: toVisualTone(category.tone),
      },
    });

    await prisma.categoryImage.deleteMany({
      where: { categoryId: category.id },
    });

    if (category.image) {
      await prisma.categoryImage.create({
        data: {
          categoryId: category.id,
          imageUrl: category.image,
          altUk: category.nameUk,
          altRu: category.nameRu,
          sortOrder: 10,
          isMain: true,
        },
      });
    }
  }
}

async function seedAttributes() {
  for (const definition of attributeDefinitions) {
    await prisma.productAttributeDefinition.upsert({
      where: { id: definition.id },
      update: {
        slug: definition.slug,
        nameUk: definition.nameUk,
        nameRu: definition.nameRu,
        type: toAttributeType(definition.type),
        isFilterable: definition.isFilterable,
        sortOrder: definition.sortOrder,
      },
      create: {
        id: definition.id,
        slug: definition.slug,
        nameUk: definition.nameUk,
        nameRu: definition.nameRu,
        type: toAttributeType(definition.type),
        isFilterable: definition.isFilterable,
        sortOrder: definition.sortOrder,
      },
    });

    await prisma.productAttributeCategory.deleteMany({
      where: { definitionId: definition.id },
    });

    for (const categoryId of definition.categoryIds ?? []) {
      await prisma.productAttributeCategory.create({
        data: {
          definitionId: definition.id,
          categoryId,
        },
      });
    }
  }
}

async function seedProducts() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        slug: product.slug,
        nameUk: product.nameUk,
        nameRu: product.nameRu,
        shortDescriptionUk: product.shortDescriptionUk,
        shortDescriptionRu: product.shortDescriptionRu,
        descriptionUk: product.descriptionUk,
        descriptionRu: product.descriptionRu,
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        sku: product.sku,
        brand: product.brand,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        ingredientsUk: product.ingredientsUk,
        ingredientsRu: product.ingredientsRu,
        usageUk: product.usageUk,
        usageRu: product.usageRu,
        warningsUk: product.warningsUk,
        warningsRu: product.warningsRu,
        skinType: product.skinType,
        status: toProductStatus(product.status),
        publicationStatus: toPublicationStatus(product.publicationStatus),
        popularity: product.popularity,
        badgeUk: product.badgeUk,
        badgeRu: product.badgeRu,
        seo: product.seo ?? {},
        tone: toVisualTone(product.tone),
        publishedAt: toDate(product.publishedAt),
        priceUpdatedAt: toDate(product.priceUpdatedAt),
      },
      create: {
        id: product.id,
        slug: product.slug,
        nameUk: product.nameUk,
        nameRu: product.nameRu,
        shortDescriptionUk: product.shortDescriptionUk,
        shortDescriptionRu: product.shortDescriptionRu,
        descriptionUk: product.descriptionUk,
        descriptionRu: product.descriptionRu,
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        sku: product.sku,
        brand: product.brand,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        ingredientsUk: product.ingredientsUk,
        ingredientsRu: product.ingredientsRu,
        usageUk: product.usageUk,
        usageRu: product.usageRu,
        warningsUk: product.warningsUk,
        warningsRu: product.warningsRu,
        skinType: product.skinType,
        status: toProductStatus(product.status),
        publicationStatus: toPublicationStatus(product.publicationStatus),
        popularity: product.popularity,
        badgeUk: product.badgeUk,
        badgeRu: product.badgeRu,
        seo: product.seo ?? {},
        tone: toVisualTone(product.tone),
        publishedAt: toDate(product.publishedAt),
        priceUpdatedAt: toDate(product.priceUpdatedAt),
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });

    if (product.images.length > 0) {
      await prisma.productImage.createMany({
        data: product.images.map((imageUrl, index) => ({
          productId: product.id,
          imageUrl,
          altUk: product.nameUk,
          altRu: product.nameRu,
          sortOrder: (index + 1) * 10,
          isMain: index === 0,
        })),
      });
    }

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: product.variants.map((variant, index) => ({
          id: variant.id,
          productId: product.id,
          optionType: variant.optionType ?? "size",
          optionNameUk: variant.optionNameUk,
          optionNameRu: variant.optionNameRu,
          labelUk: variant.labelUk,
          labelRu: variant.labelRu,
          colorHex: variant.colorHex,
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          imageUrl: variant.image,
          sortOrder: variant.sortOrder || (index + 1) * 10,
          isDefault: variant.isDefault,
          isActive: variant.isActive,
        })),
      });
    }

    await prisma.productAttributeValue.deleteMany({
      where: { productId: product.id },
    });

    for (const attribute of product.attributes) {
      await prisma.productAttributeValue.create({
        data: {
          productId: product.id,
          definitionId: attribute.definitionId,
          ...toAttributeValue(attribute.value),
          valueUk: attribute.valueUk,
          valueRu: attribute.valueRu,
        },
      });
    }
  }

  const productIds = new Set(products.map((product) => product.id));
  await prisma.productComboOffer.deleteMany({
    where: { sourceProductId: { in: [...productIds] } },
  });

  for (const product of products) {
    const comboOffers = (product.comboOffers ?? []).flatMap((offer) => {
      const targetProductIds = getComboOfferTargetIds(offer).filter(
        (targetProductId) =>
          targetProductId !== product.id && productIds.has(targetProductId),
      );
      const targetProductId = targetProductIds[0];

      if (!offer.isActive || !targetProductId) {
        return [];
      }

      return [
        {
          offer,
          targetProductId,
          targetProductIds,
        },
      ];
    });

    if (comboOffers.length === 0) {
      continue;
    }

    await prisma.productComboOffer.createMany({
      data: comboOffers.map((offer, index) => ({
        id: offer.offer.id,
        sourceProductId: product.id,
        targetProductId: offer.targetProductId,
        targetProductIds: offer.targetProductIds,
        titleUk: offer.offer.titleUk,
        titleRu: offer.offer.titleRu,
        descriptionUk: offer.offer.descriptionUk,
        descriptionRu: offer.offer.descriptionRu,
        discountPercent: Math.max(
          1,
          Math.min(80, offer.offer.discountPercent || 10),
        ),
        sortOrder: offer.offer.sortOrder || (index + 1) * 10,
        isActive: offer.offer.isActive,
      })),
    });
  }
}

async function seedSiteSettings() {
  await prisma.siteSettings.upsert({
    where: { id: "site-settings" },
    update: {
      storeName: siteSettings.storeName,
      logoText: siteSettings.branding?.logoText,
      faviconText: siteSettings.branding?.faviconText,
      logoAsset: siteSettings.branding?.logoAsset,
      faviconAsset: siteSettings.branding?.faviconAsset,
      slogan: siteSettings.slogan,
      description: siteSettings.description,
      contactPhone: siteSettings.contactPhone,
      contactEmail: siteSettings.contactEmail,
      socialLinks: siteSettings.socialLinks ?? {},
      colors: siteSettings.colors,
      hero: siteSettings.hero,
      promoBanner: siteSettings.promoBanner,
      footerText: siteSettings.footerText,
      seo: siteSettings.seo,
      heroMediaSlides: siteSettings.heroMediaSlides ?? [],
    },
    create: {
      id: "site-settings",
      storeName: siteSettings.storeName,
      logoText: siteSettings.branding?.logoText,
      faviconText: siteSettings.branding?.faviconText,
      logoAsset: siteSettings.branding?.logoAsset,
      faviconAsset: siteSettings.branding?.faviconAsset,
      slogan: siteSettings.slogan,
      description: siteSettings.description,
      contactPhone: siteSettings.contactPhone,
      contactEmail: siteSettings.contactEmail,
      socialLinks: siteSettings.socialLinks ?? {},
      colors: siteSettings.colors,
      hero: siteSettings.hero,
      promoBanner: siteSettings.promoBanner,
      footerText: siteSettings.footerText,
      seo: siteSettings.seo,
      heroMediaSlides: siteSettings.heroMediaSlides ?? [],
    },
  });
}

async function seedSiteVisuals() {
  const visuals = siteSettings.visuals ?? {};

  for (const [key, imageUrl] of Object.entries(visuals)) {
    if (!imageUrl) {
      continue;
    }

    await prisma.siteVisual.upsert({
      where: { key },
      update: {
        label: toVisualLabel(key),
        imageUrl,
        tone: VisualTone.CREAM,
        isActive: true,
      },
      create: {
        key,
        label: toVisualLabel(key),
        imageUrl,
        tone: VisualTone.CREAM,
        isActive: true,
      },
    });
  }
}

async function seedHeroMediaSlides() {
  for (const slide of siteSettings.heroMediaSlides ?? []) {
    const linkedProduct = slide.productSlug
      ? products.find((product) => product.slug === slide.productSlug)
      : undefined;

    await prisma.heroMediaSlide.upsert({
      where: { id: slide.id },
      update: {
        imageUrl: slide.imageUrl,
        title: slide.title,
        linkType: slide.linkType,
        href: slide.href,
        productId: linkedProduct?.id,
        productSlug: slide.productSlug,
        sortOrder: slide.sortOrder,
        isActive: slide.isActive,
      },
      create: {
        id: slide.id,
        imageUrl: slide.imageUrl,
        title: slide.title,
        linkType: slide.linkType,
        href: slide.href,
        productId: linkedProduct?.id,
        productSlug: slide.productSlug,
        sortOrder: slide.sortOrder,
        isActive: slide.isActive,
      },
    });
  }
}

async function seedHomepageSections() {
  for (const section of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { id: section.id },
      update: {
        type: section.type,
        title: section.title ?? {},
        isVisible: section.isVisible,
        sortOrder: section.sortOrder,
        variant: section.variant,
        config: section.config ?? {},
      },
      create: {
        id: section.id,
        type: section.type,
        title: section.title ?? {},
        isVisible: section.isVisible,
        sortOrder: section.sortOrder,
        variant: section.variant,
        config: section.config ?? {},
      },
    });
  }

  await prisma.homepageSection.upsert({
    where: { id: "homepage-benefits-content" },
    update: {
      type: "benefitsContent",
      isVisible: false,
      sortOrder: 1000,
      config: { deliveryInfo },
    },
    create: {
      id: "homepage-benefits-content",
      type: "benefitsContent",
      isVisible: false,
      sortOrder: 1000,
      config: { deliveryInfo },
    },
  });
}

async function seedMenuAndFooter() {
  const headerCategories = categories
    .filter((category) => category.isActive && category.showInHeader)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const category of headerCategories) {
    await prisma.storefrontMenuItem.upsert({
      where: { id: `menu-${category.id}` },
      update: {
        label: { uk: category.nameUk, ru: category.nameRu },
        href: `/catalog?category=${category.slug}`,
        categoryId: category.id,
        placement: "header",
        isVisible: true,
        sortOrder: category.sortOrder,
      },
      create: {
        id: `menu-${category.id}`,
        label: { uk: category.nameUk, ru: category.nameRu },
        href: `/catalog?category=${category.slug}`,
        categoryId: category.id,
        placement: "header",
        isVisible: true,
        sortOrder: category.sortOrder,
      },
    });
  }

  await prisma.footerNavigationGroup.upsert({
    where: { id: "footer-categories" },
    update: {
      title: { uk: "Категорії", ru: "Категории" },
      sortOrder: 10,
      isVisible: true,
    },
    create: {
      id: "footer-categories",
      title: { uk: "Категорії", ru: "Категории" },
      sortOrder: 10,
      isVisible: true,
    },
  });

  const footerCategories = categories
    .filter((category) => category.isActive && !category.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const category of footerCategories) {
    await prisma.footerNavigationLink.upsert({
      where: { id: `footer-category-${category.id}` },
      update: {
        groupId: "footer-categories",
        label: { uk: category.nameUk, ru: category.nameRu },
        href: `/catalog?category=${category.slug}`,
        categoryId: category.id,
        sortOrder: category.sortOrder,
        isVisible: true,
      },
      create: {
        id: `footer-category-${category.id}`,
        groupId: "footer-categories",
        label: { uk: category.nameUk, ru: category.nameRu },
        href: `/catalog?category=${category.slug}`,
        categoryId: category.id,
        sortOrder: category.sortOrder,
        isVisible: true,
      },
    });
  }
}

async function seedDeliveryPaymentSettings() {
  const settings = seedConfig.deliveryPayment ?? getDefaultDeliveryPaymentSettings();
  const deliveryMethods = [
    { key: "nova_poshta", enabled: settings.novaPoshtaEnabled },
    { key: "ukrposhta", enabled: settings.ukrposhtaEnabled },
    { key: "pickup", enabled: settings.pickupEnabled },
  ];
  const paymentMethods = [
    { key: "cash_on_delivery", enabled: settings.cashOnDeliveryEnabled },
    { key: "online_payment", enabled: settings.onlinePaymentEnabled },
    { key: "card_on_delivery", enabled: settings.cardOnDeliveryEnabled },
  ];

  await prisma.deliveryPaymentSettings.upsert({
    where: { id: "delivery-payment" },
    update: {
      settings,
      deliveryMethods,
      paymentMethods,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      regions: deliveryInfo,
    },
    create: {
      id: "delivery-payment",
      settings,
      deliveryMethods,
      paymentMethods,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      regions: deliveryInfo,
    },
  });
}

async function seedCoupons() {
  const seedCoupons =
    coupons.length > 0
      ? coupons
      : [
          {
            id: "coupon-welcome10",
            code: "WELCOME10",
            discountType: "percent" as const,
            discountValue: 10,
            isActive: true,
            expiresAt: "",
            usageLimit: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

  for (const coupon of seedCoupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        discountType:
          coupon.discountType === "fixed"
            ? CouponDiscountType.FIXED
            : CouponDiscountType.PERCENT,
        value: coupon.discountValue,
        endsAt: toNullableDate(coupon.expiresAt),
        usageLimit: coupon.usageLimit ?? null,
        isActive: coupon.isActive,
      },
      create: {
        id: coupon.id,
        code: coupon.code,
        discountType:
          coupon.discountType === "fixed"
            ? CouponDiscountType.FIXED
            : CouponDiscountType.PERCENT,
        value: coupon.discountValue,
        endsAt: toNullableDate(coupon.expiresAt),
        usageLimit: coupon.usageLimit ?? null,
        isActive: coupon.isActive,
      },
    });
  }
}

async function seedProductFeedback() {
  for (const review of productReviews) {
    await prisma.productFeedback.upsert({
      where: { id: review.id },
      update: {
        productId: review.productId,
        type: review.type === "question" ? FeedbackType.QUESTION : FeedbackType.REVIEW,
        status: toReviewStatus(review.status),
        rating: review.rating,
        customerName: review.customerName,
        customerEmail: review.customerEmail,
        customerPhone: review.customerPhone,
        comment: review.comment,
        adminReply: review.adminReply,
        adminRepliedAt: toDate(review.adminRepliedAt),
        isVerifiedPurchase: review.isVerifiedPurchase,
      },
      create: {
        id: review.id,
        productId: review.productId,
        type: review.type === "question" ? FeedbackType.QUESTION : FeedbackType.REVIEW,
        status: toReviewStatus(review.status),
        rating: review.rating,
        customerName: review.customerName,
        customerEmail: review.customerEmail,
        customerPhone: review.customerPhone,
        comment: review.comment,
        adminReply: review.adminReply,
        adminRepliedAt: toDate(review.adminRepliedAt),
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: toDate(review.createdAt),
      },
    });
  }
}

function toVisualTone(tone: string | undefined) {
  switch (tone) {
    case "rose":
      return VisualTone.ROSE;
    case "sage":
      return VisualTone.SAGE;
    case "linen":
      return VisualTone.LINEN;
    default:
      return VisualTone.CREAM;
  }
}

function toProductStatus(status: string) {
  switch (status) {
    case "draft":
      return ProductStatus.DRAFT;
    case "out_of_stock":
      return ProductStatus.OUT_OF_STOCK;
    default:
      return ProductStatus.ACTIVE;
  }
}

function toPublicationStatus(status: string | undefined) {
  switch (status) {
    case "draft":
      return ProductPublicationStatus.DRAFT;
    case "pending_review":
      return ProductPublicationStatus.PENDING_REVIEW;
    case "archived":
      return ProductPublicationStatus.ARCHIVED;
    default:
      return ProductPublicationStatus.PUBLISHED;
  }
}

function toAttributeType(type: string) {
  switch (type) {
    case "number":
      return AttributeType.NUMBER;
    case "boolean":
      return AttributeType.BOOLEAN;
    case "select":
      return AttributeType.SELECT;
    case "multiselect":
      return AttributeType.MULTISELECT;
    default:
      return AttributeType.TEXT;
  }
}

function toReviewStatus(status: string) {
  switch (status) {
    case "approved":
      return ReviewStatus.APPROVED;
    case "rejected":
      return ReviewStatus.REJECTED;
    default:
      return ReviewStatus.PENDING;
  }
}

function toAttributeValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) {
    return { valueJson: value };
  }

  if (typeof value === "number") {
    return { valueNumber: value };
  }

  if (typeof value === "boolean") {
    return { valueBoolean: value };
  }

  return { valueString: value };
}

function toVisualLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase());
}

function toDate(value: string | undefined) {
  return value ? new Date(value) : undefined;
}

function toNullableDate(value: string | undefined) {
  return value ? new Date(value) : null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
