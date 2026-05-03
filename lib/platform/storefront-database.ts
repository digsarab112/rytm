import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import {
  AttributeType,
  CouponDiscountType,
  FeedbackType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  ProductPublicationStatus,
  ProductStatus,
  ReviewStatus,
  ShipmentStatus,
  VisualTone,
} from "@/lib/generated/prisma/client";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";
import { getComboOfferTargetIds } from "@/lib/catalog/combo-offers";
import { getDefaultStorefrontConfig } from "@/lib/platform/storefront-config";
import type { Coupon, DeliveryPaymentSettings } from "@/types/admin";
import type {
  DeliveryMethod,
  DeliveryProvider,
  DeliveryStatus,
  MockOrder,
  MockOrderStatus,
  PaymentMethod,
} from "@/types/cart";
import type { CustomerAccount } from "@/types/customer";
import type { StorefrontConfig, StorefrontConfigOverrides } from "@/types/platform";
import type {
  CategoryPreview,
  HeroMediaSlide,
  LocalizedText,
  ProductAttributeDefinition,
  ProductAttributeValue,
  ProductPreview,
  ProductReview,
  ProductReviewStatus,
  ProductStatus as StoreProductStatus,
  Supplier,
  VisualTone as StoreVisualTone,
} from "@/types/store";

export async function readDatabaseStorefrontConfig(): Promise<StorefrontConfig | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  noStore();

  try {
    const prisma = getPrismaClient();
    const [
      siteSettings,
      siteVisuals,
      heroSlides,
      categories,
      suppliers,
      products,
      attributeDefinitions,
      productFeedback,
      homepageSections,
      deliveryPayment,
      coupons,
      orders,
      customers,
    ] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "site-settings" } }),
      prisma.siteVisual.findMany({ where: { isActive: true } }),
      prisma.heroMediaSlide.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ sortOrder: "asc" }, { nameUk: "asc" }],
      }),
      prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { sortOrder: "asc" } },
          comboOffers: { orderBy: { sortOrder: "asc" } },
          attributeValues: true,
        },
        orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
      }),
      prisma.productAttributeDefinition.findMany({
        include: { categories: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.productFeedback.findMany({
        include: { replies: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.deliveryPaymentSettings.findUnique({
        where: { id: "delivery-payment" },
      }),
      prisma.coupon.findMany({ orderBy: { code: "asc" } }),
      prisma.order.findMany({
        include: {
          items: true,
          shipments: true,
          paymentTransactions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.findMany({ include: { profile: true } }),
    ]);

    const fallback = getDefaultStorefrontConfig();
    const settings = siteSettings
      ? mapSiteSettings(siteSettings, siteVisuals, heroSlides, fallback)
      : fallback.settings;

    return {
      ...fallback,
      settings,
      categories: categories.map(mapCategory),
      suppliers: suppliers.map(mapSupplier),
      products: products.map(mapProduct),
      productReviews: productFeedback.map(mapProductFeedback),
      attributeDefinitions: attributeDefinitions.map(mapAttributeDefinition),
      homepageSections: homepageSections.map((section) => ({
        id: section.id,
        type: section.type as StorefrontConfig["homepageSections"][number]["type"],
        isVisible: section.isVisible,
        sortOrder: section.sortOrder,
        variant: section.variant as
          | StorefrontConfig["homepageSections"][number]["variant"]
          | undefined,
        title: toRecord(section.title),
        config: toRecord(section.config),
      })),
      deliveryPayment: mapDeliveryPaymentSettings(
        deliveryPayment?.settings,
        fallback.deliveryPayment,
      ),
      coupons: coupons.map(mapCoupon),
      orders: orders.map(mapOrder),
      customers: customers.map(mapCustomer),
    };
  } catch (error) {
    console.warn("Database storefront config read failed; falling back.", error);
    return null;
  }
}

export async function saveDatabaseOverrideValue(
  overrideKey: keyof StorefrontConfigOverrides,
  value: unknown,
) {
  if (!isDatabaseConfigured()) {
    return false;
  }

  try {
    switch (overrideKey) {
      case "settings":
        await saveSettings(value);
        return true;
      case "categories":
        await saveCategories(value);
        return true;
      case "products":
        await saveProducts(value);
        return true;
      case "suppliers":
        await saveSuppliers(value);
        return true;
      case "productReviews":
        await saveProductReviews(value);
        return true;
      case "attributeDefinitions":
        await saveAttributeDefinitions(value);
        return true;
      case "homepageSections":
        await saveHomepageSections(value);
        return true;
      case "deliveryPayment":
        await saveDeliveryPayment(value);
        return true;
      case "coupons":
        await saveCoupons(value);
        return true;
      case "orders":
        await saveOrders(value);
        return true;
      case "customers":
        await saveCustomers(value);
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.warn("Database storefront config write failed.", error);
    return false;
  }
}

async function saveSettings(value: unknown) {
  const settings = value as StorefrontConfig["settings"];
  const prisma = getPrismaClient();
  const visuals = settings.visuals ?? {};

  await prisma.siteSettings.upsert({
    where: { id: "site-settings" },
    update: {
      storeName: settings.storeName,
      logoText: settings.branding?.logoText,
      faviconText: settings.branding?.faviconText,
      logoAsset: settings.branding?.logoAsset,
      faviconAsset: settings.branding?.faviconAsset,
      slogan: settings.slogan,
      description: settings.description,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      socialLinks: settings.socialLinks ?? {},
      colors: settings.colors,
      hero: settings.hero,
      promoBanner: settings.promoBanner,
      footerText: settings.footerText,
      seo: settings.seo,
      heroMediaSlides: settings.heroMediaSlides ?? [],
    },
    create: {
      id: "site-settings",
      storeName: settings.storeName,
      logoText: settings.branding?.logoText,
      faviconText: settings.branding?.faviconText,
      logoAsset: settings.branding?.logoAsset,
      faviconAsset: settings.branding?.faviconAsset,
      slogan: settings.slogan,
      description: settings.description,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      socialLinks: settings.socialLinks ?? {},
      colors: settings.colors,
      hero: settings.hero,
      promoBanner: settings.promoBanner,
      footerText: settings.footerText,
      seo: settings.seo,
      heroMediaSlides: settings.heroMediaSlides ?? [],
    },
  });

  for (const [key, imageUrl] of Object.entries(visuals)) {
    if (!imageUrl) {
      continue;
    }

    await prisma.siteVisual.upsert({
      where: { key },
      update: { imageUrl, label: key, isActive: true },
      create: { key, imageUrl, label: key, isActive: true },
    });
  }

  await prisma.heroMediaSlide.deleteMany();
  for (const slide of settings.heroMediaSlides ?? []) {
    const linkedProduct = slide.productSlug
      ? await prisma.product.findUnique({ where: { slug: slide.productSlug } })
      : null;

    await prisma.heroMediaSlide.create({
      data: {
        id: slide.id,
        imageUrl: slide.imageUrl,
        title: slide.title,
        linkType: slide.linkType,
        href: slide.href,
        productId: linkedProduct?.id,
        productSlug: slide.productSlug,
        isActive: slide.isActive,
        sortOrder: slide.sortOrder,
      },
    });
  }
}

async function saveCategories(value: unknown) {
  const categories = value as CategoryPreview[];
  const prisma = getPrismaClient();
  const ids = new Set(categories.map((category) => category.id));

  for (const category of categories) {
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
        tone: toPrismaVisualTone(category.tone),
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
        tone: toPrismaVisualTone(category.tone),
      },
    });

    await prisma.categoryImage.deleteMany({ where: { categoryId: category.id } });
    if (category.image) {
      await prisma.categoryImage.create({
        data: {
          categoryId: category.id,
          imageUrl: category.image,
          altUk: category.nameUk,
          altRu: category.nameRu,
          isMain: true,
          sortOrder: 10,
        },
      });
    }
  }

  await prisma.category.updateMany({
    where: { id: { notIn: [...ids] } },
    data: { isActive: false, showInHeader: false, showOnHomepage: false },
  });
}

async function saveSuppliers(value: unknown) {
  const suppliers = value as Supplier[];
  const prisma = getPrismaClient();
  const ids = new Set(suppliers.map((supplier) => supplier.id));

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: mapSupplierWrite(supplier),
      create: { id: supplier.id, ...mapSupplierWrite(supplier) },
    });
  }

  await prisma.supplier.updateMany({
    where: { id: { notIn: [...ids] } },
    data: { isActive: false },
  });
}

async function saveProducts(value: unknown) {
  const products = value as ProductPreview[];
  const prisma = getPrismaClient();
  const ids = new Set(products.map((product) => product.id));

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: mapProductWrite(product),
      create: { id: product.id, ...mapProductWrite(product) },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (product.images.length > 0) {
      await prisma.productImage.createMany({
        data: product.images.map((imageUrl, index) => ({
          productId: product.id,
          imageUrl,
          altUk: product.nameUk,
          altRu: product.nameRu,
          isMain: index === 0,
          sortOrder: (index + 1) * 10,
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
          ...toPrismaAttributeValue(attribute.value),
          valueUk: attribute.valueUk,
          valueRu: attribute.valueRu,
        },
      });
    }

    await prisma.productVariant.deleteMany({
      where: { productId: product.id },
    });
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

    await prisma.productComboOffer.deleteMany({
      where: { sourceProductId: product.id },
    });
    if (Array.isArray(product.comboOffers) && product.comboOffers.length > 0) {
      const comboOfferRows = product.comboOffers.flatMap((offer, index) => {
        const targetProductIds = getComboOfferTargetIds(offer).filter(
          (targetProductId) => targetProductId !== product.id,
        );
        const targetProductId = targetProductIds[0];

        if (!targetProductId) {
          return [];
        }

        return [
          {
            id: offer.id,
            sourceProductId: product.id,
            targetProductId,
            targetProductIds,
            titleUk: offer.titleUk,
            titleRu: offer.titleRu,
            descriptionUk: offer.descriptionUk,
            descriptionRu: offer.descriptionRu,
            discountPercent: Math.max(1, Math.min(80, offer.discountPercent || 10)),
            sortOrder: offer.sortOrder || (index + 1) * 10,
            isActive: offer.isActive,
          },
        ];
      });

      if (comboOfferRows.length > 0) {
        await prisma.productComboOffer.createMany({
          data: comboOfferRows,
        });
      }
    }
  }

  await prisma.product.updateMany({
    where: { id: { notIn: [...ids] } },
    data: { status: ProductStatus.DRAFT, publicationStatus: ProductPublicationStatus.ARCHIVED },
  });
}

async function saveAttributeDefinitions(value: unknown) {
  const definitions = value as ProductAttributeDefinition[];
  const prisma = getPrismaClient();

  for (const definition of definitions) {
    await prisma.productAttributeDefinition.upsert({
      where: { id: definition.id },
      update: {
        slug: definition.slug,
        nameUk: definition.nameUk,
        nameRu: definition.nameRu,
        type: toPrismaAttributeType(definition.type),
        isFilterable: definition.isFilterable,
        sortOrder: definition.sortOrder,
      },
      create: {
        id: definition.id,
        slug: definition.slug,
        nameUk: definition.nameUk,
        nameRu: definition.nameRu,
        type: toPrismaAttributeType(definition.type),
        isFilterable: definition.isFilterable,
        sortOrder: definition.sortOrder,
      },
    });
    await prisma.productAttributeCategory.deleteMany({
      where: { definitionId: definition.id },
    });
    for (const categoryId of definition.categoryIds ?? []) {
      await prisma.productAttributeCategory.create({
        data: { definitionId: definition.id, categoryId },
      });
    }
  }
}

async function saveProductReviews(value: unknown) {
  const reviews = value as ProductReview[];
  const prisma = getPrismaClient();
  const ids = new Set(reviews.map((review) => review.id));

  for (const review of reviews) {
    const product = await prisma.product.findUnique({ where: { id: review.productId } });
    if (!product) {
      continue;
    }

    await prisma.productFeedback.upsert({
      where: { id: review.id },
      update: mapReviewWrite(review),
      create: { id: review.id, ...mapReviewWrite(review) },
    });

    await prisma.productFeedbackReply.deleteMany({
      where: { feedbackId: review.id },
    });
    if (Array.isArray(review.replies) && review.replies.length > 0) {
      await prisma.productFeedbackReply.createMany({
        data: review.replies.map((reply) => ({
          id: reply.id,
          feedbackId: review.id,
          status: toPrismaReviewStatus(reply.status),
          customerName: reply.customerName,
          customerEmail: reply.customerEmail,
          customerPhone: reply.customerPhone,
          comment: reply.comment,
          createdAt: toDate(reply.createdAt) ?? new Date(),
          updatedAt: toDate(reply.updatedAt) ?? new Date(),
        })),
      });
    }
  }

  await prisma.productFeedback.deleteMany({ where: { id: { notIn: [...ids] } } });
}

async function saveHomepageSections(value: unknown) {
  const sections = value as StorefrontConfig["homepageSections"];
  const prisma = getPrismaClient();
  const ids = new Set(sections.map((section) => section.id));

  for (const section of sections) {
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

  await prisma.homepageSection.deleteMany({ where: { id: { notIn: [...ids] } } });
}

async function saveDeliveryPayment(value: unknown) {
  const settings = value as DeliveryPaymentSettings;
  await getPrismaClient().deliveryPaymentSettings.upsert({
    where: { id: "delivery-payment" },
    update: { settings },
    create: { id: "delivery-payment", settings },
  });
}

async function saveCoupons(value: unknown) {
  const coupons = value as Coupon[];
  const prisma = getPrismaClient();
  const ids = new Set(coupons.map((coupon) => coupon.id));

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { id: coupon.id },
      update: mapCouponWrite(coupon),
      create: { id: coupon.id, ...mapCouponWrite(coupon) },
    });
  }

  await prisma.coupon.deleteMany({ where: { id: { notIn: [...ids] } } });
}

async function saveOrders(value: unknown) {
  const orders = value as MockOrder[];
  const prisma = getPrismaClient();
  const ids = new Set(orders.map((order) => order.id));

  for (const order of orders) {
    await upsertOrder(order);
  }

  await prisma.order.deleteMany({ where: { publicId: { notIn: [...ids] } } });
}

async function saveCustomers(value: unknown) {
  const customers = value as CustomerAccount[];
  const prisma = getPrismaClient();

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {
        name: customer.name,
        email: customer.email,
        passwordHash: customer.passwordHash,
      },
      create: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        passwordHash: customer.passwordHash,
      },
    });
  }
}

export async function upsertOrder(order: MockOrder, customerId?: string) {
  const prisma = getPrismaClient();
  const customer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : await prisma.customer.findUnique({ where: { email: order.email.toLowerCase() } });

  const orderData = mapOrderWrite(order);
  const customerRelation = customer
    ? { connect: { id: customer.id } }
    : { disconnect: true };
  const savedOrder = await prisma.order.upsert({
    where: { publicId: order.id },
    update: { ...orderData, customer: customerRelation },
    create: {
      publicId: order.id,
      ...orderData,
      ...(customer ? { customer: { connect: { id: customer.id } } } : {}),
    },
  });

  await prisma.orderItem.deleteMany({ where: { orderId: savedOrder.id } });
  if (order.items.length > 0) {
    await prisma.orderItem.createMany({
      data: order.items.map((item) => ({
        orderId: savedOrder.id,
        productId: item.productId,
        supplierId: item.supplierId,
        productSlug: item.productId,
        productNameUk: item.nameUk,
        productNameRu: item.nameRu,
        sku: item.sku,
        variantId: item.variantId,
        variantLabelUk: item.variantLabelUk,
        variantLabelRu: item.variantLabelRu,
        variantSku: item.variantSku,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.lineTotal,
      })),
    });
  }

  await prisma.shipment.deleteMany({ where: { orderId: savedOrder.id } });
  for (const shipment of order.shipments ?? []) {
    await prisma.shipment.create({
      data: {
        orderId: savedOrder.id,
        supplierId:
          shipment.supplierId === "unassigned" ? undefined : shipment.supplierId,
        status: toPrismaShipmentStatus(shipment.deliveryStatus),
        fulfillmentType: "manual",
        carrier: shipment.deliveryProvider,
        city: order.city,
        warehouse: order.novaPoshtaBranch,
        ttn: shipment.ttnNumber,
        notes: shipment.notificationLog.join("\n"),
      },
    });
  }

  await prisma.paymentTransaction.upsert({
    where: { id: order.paymentId ?? `payment-${order.id}` },
    update: {
      status: toPrismaPaymentStatus(order.paymentStatus),
      amount: order.paymentAmount ?? order.total,
      currency: order.paymentCurrency ?? "UAH",
      rawPayload: { message: order.paymentRawResponse ?? "" },
    },
    create: {
      id: order.paymentId ?? `payment-${order.id}`,
      orderId: savedOrder.id,
      provider: order.paymentProvider === "liqpay" ? PaymentProvider.LIQPAY : PaymentProvider.MANUAL,
      status: toPrismaPaymentStatus(order.paymentStatus),
      amount: order.paymentAmount ?? order.total,
      currency: order.paymentCurrency ?? "UAH",
      externalId: order.paymentId,
      rawPayload: { message: order.paymentRawResponse ?? "" },
    },
  });

  return mapOrder({
    ...savedOrder,
    items: order.items.map((item) => ({
      id: `${savedOrder.id}-${item.productId}-${item.variantId ?? "base"}-${item.sku}`,
      orderId: savedOrder.id,
      productId: item.productId,
      supplierId: item.supplierId ?? null,
      productSlug: item.productId,
      productNameUk: item.nameUk,
      productNameRu: item.nameRu,
      sku: item.sku,
      variantId: item.variantId ?? null,
      variantLabelUk: item.variantLabelUk ?? null,
      variantLabelRu: item.variantLabelRu ?? null,
      variantSku: item.variantSku ?? null,
      quantity: item.quantity,
      unitPrice: new Prisma.Decimal(item.price),
      salePrice: null,
      lineTotal: new Prisma.Decimal(item.lineTotal),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    shipments: (order.shipments ?? []).map((shipment) => ({
      id: shipment.id,
      orderId: savedOrder.id,
      supplierId: shipment.supplierId,
      status: toPrismaShipmentStatus(shipment.deliveryStatus),
      fulfillmentType: "manual",
      carrier: shipment.deliveryProvider,
      city: order.city,
      warehouse: order.novaPoshtaBranch,
      ttn: shipment.ttnNumber,
      trackingUrl: null,
      notes: shipment.notificationLog.join("\n"),
      shippedAt: null,
      deliveredAt: null,
      createdAt: new Date(shipment.createdAt),
      updatedAt: new Date(shipment.updatedAt),
    })),
    paymentTransactions: [],
  });
}

function mapSiteSettings(
  settings: {
    storeName: string;
    logoText: string | null;
    faviconText: string | null;
    logoAsset: string | null;
    faviconAsset: string | null;
    slogan: Prisma.JsonValue;
    description: Prisma.JsonValue;
    contactPhone: string | null;
    contactEmail: string | null;
    socialLinks: Prisma.JsonValue;
    colors: Prisma.JsonValue;
    hero: Prisma.JsonValue;
    promoBanner: Prisma.JsonValue;
    footerText: Prisma.JsonValue;
    seo: Prisma.JsonValue;
    heroMediaSlides: Prisma.JsonValue;
  },
  visuals: Array<{ key: string; imageUrl: string }>,
  heroSlides: Array<{
    id: string;
    imageUrl: string;
    title: Prisma.JsonValue;
    linkType: string;
    href: string | null;
    productSlug: string | null;
    isActive: boolean;
    sortOrder: number;
  }>,
  fallback: StorefrontConfig,
): StorefrontConfig["settings"] {
  const visualMap = Object.fromEntries(
    visuals.map((visual) => [visual.key, visual.imageUrl]),
  );
  const savedHeroSlides =
    heroSlides.length > 0
      ? heroSlides.map(mapHeroMediaSlide)
      : toArray(settings.heroMediaSlides);

  return {
    ...fallback.settings,
    storeName: settings.storeName,
    branding: {
      logoText: settings.logoText ?? settings.storeName,
      faviconText: settings.faviconText ?? "R",
      logoAsset: settings.logoAsset ?? undefined,
      faviconAsset: settings.faviconAsset ?? undefined,
    },
    slogan: toLocalizedText(settings.slogan, fallback.settings.slogan),
    description: toLocalizedText(settings.description, fallback.settings.description),
    contactPhone: settings.contactPhone ?? fallback.settings.contactPhone,
    contactEmail: settings.contactEmail ?? fallback.settings.contactEmail,
    socialLinks: toRecord(settings.socialLinks),
    colors: {
      ...fallback.settings.colors,
      ...toRecord(settings.colors),
    },
    visuals: {
      ...fallback.settings.visuals,
      ...visualMap,
    },
    hero: {
      ...fallback.settings.hero,
      ...toRecord(settings.hero),
    },
    promoBanner: {
      ...fallback.settings.promoBanner,
      ...toRecord(settings.promoBanner),
    },
    footerText: toLocalizedText(settings.footerText, fallback.settings.footerText),
    seo: {
      ...fallback.settings.seo,
      ...toRecord(settings.seo),
    },
    heroMediaSlides: isHeroMediaSlides(savedHeroSlides)
      ? savedHeroSlides
      : fallback.settings.heroMediaSlides,
  };
}

function mapHeroMediaSlide(slide: {
  id: string;
  imageUrl: string;
  title: Prisma.JsonValue;
  linkType: string;
  href: string | null;
  productSlug: string | null;
  isActive: boolean;
  sortOrder: number;
}): HeroMediaSlide {
  return {
    id: slide.id,
    imageUrl: slide.imageUrl,
    title: toLocalizedText(slide.title, { uk: "", ru: "" }),
    linkType: slide.linkType === "product" ? "product" : "custom",
    href: slide.href ?? undefined,
    productSlug: slide.productSlug ?? undefined,
    isActive: slide.isActive,
    sortOrder: slide.sortOrder,
  };
}

function mapCategory(category: {
  id: string;
  parentId: string | null;
  slug: string;
  nameUk: string;
  nameRu: string;
  descriptionUk: string;
  descriptionRu: string;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  showInHeader: boolean;
  showOnHomepage: boolean;
  showInCatalogNavigation: boolean;
  tone: VisualTone;
  images?: Array<{ imageUrl: string; isMain: boolean }>;
}): CategoryPreview {
  const image =
    category.images?.find((item) => item.isMain)?.imageUrl ??
    category.images?.[0]?.imageUrl ??
    category.imageUrl ??
    undefined;

  return {
    id: category.id,
    parentId: category.parentId ?? undefined,
    nameUk: category.nameUk,
    nameRu: category.nameRu,
    slug: category.slug,
    descriptionUk: category.descriptionUk,
    descriptionRu: category.descriptionRu,
    icon: category.icon ?? undefined,
    image,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    showInHeader: category.showInHeader,
    showOnHomepage: category.showOnHomepage,
    showInCatalogNavigation: category.showInCatalogNavigation,
    tone: fromPrismaVisualTone(category.tone),
  };
}

function mapSupplier(supplier: {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  novaPoshtaWarehouse: string | null;
  notes: string | null;
  isActive: boolean;
  supplierApiKey: string | null;
  supplierTelegram: string | null;
  supplierViber: string | null;
  supplierPaymentInfo: string | null;
  supplierCommissionType: string | null;
  supplierCommissionValue: Prisma.Decimal | null;
  createdAt: Date;
  updatedAt: Date;
}): Supplier {
  return {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName ?? "",
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    city: supplier.city ?? "",
    novaPoshtaWarehouse: supplier.novaPoshtaWarehouse ?? "",
    notes: supplier.notes ?? "",
    isActive: supplier.isActive,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
    supplierApiKey: supplier.supplierApiKey ?? undefined,
    supplierTelegram: supplier.supplierTelegram ?? undefined,
    supplierViber: supplier.supplierViber ?? undefined,
    supplierPaymentInfo: supplier.supplierPaymentInfo ?? undefined,
    supplierCommissionType: supplier.supplierCommissionType as
      | Supplier["supplierCommissionType"]
      | undefined,
    supplierCommissionValue: supplier.supplierCommissionValue
      ? Number(supplier.supplierCommissionValue)
      : undefined,
  };
}

function mapProduct(product: {
  id: string;
  slug: string;
  nameUk: string;
  nameRu: string;
  shortDescriptionUk: string;
  shortDescriptionRu: string;
  descriptionUk: string;
  descriptionRu: string;
  price: Prisma.Decimal;
  salePrice: Prisma.Decimal | null;
  stock: number;
  sku: string;
  brand: string | null;
  categoryId: string;
  supplierId: string | null;
  supplierName: string | null;
  ingredientsUk: string;
  ingredientsRu: string;
  usageUk: string;
  usageRu: string;
  warningsUk: string;
  warningsRu: string;
  skinType: string | null;
  status: ProductStatus;
  publicationStatus: ProductPublicationStatus;
  popularity: number;
  badgeUk: string | null;
  badgeRu: string | null;
  seo: Prisma.JsonValue;
  tone: VisualTone;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  priceUpdatedAt: Date | null;
  images?: Array<{ imageUrl: string }>;
  variants?: Array<{
    id: string;
    optionType: string | null;
    optionNameUk: string | null;
    optionNameRu: string | null;
    labelUk: string;
    labelRu: string;
    colorHex: string | null;
    sku: string | null;
    price: Prisma.Decimal;
    salePrice: Prisma.Decimal | null;
    stock: number;
    imageUrl: string | null;
    sortOrder: number;
    isDefault: boolean;
    isActive: boolean;
  }>;
  comboOffers?: Array<{
    id: string;
    targetProductId: string;
    targetProductIds: Prisma.JsonValue;
    titleUk: string | null;
    titleRu: string | null;
    descriptionUk: string | null;
    descriptionRu: string | null;
    discountPercent: number;
    sortOrder: number;
    isActive: boolean;
  }>;
  attributeValues?: Array<{
    definitionId: string;
    valueString: string | null;
    valueNumber: Prisma.Decimal | null;
    valueBoolean: boolean | null;
    valueJson: Prisma.JsonValue;
    valueUk: string | null;
    valueRu: string | null;
  }>;
}): ProductPreview {
  return {
    id: product.id,
    slug: product.slug,
    nameUk: product.nameUk,
    nameRu: product.nameRu,
    shortDescriptionUk: product.shortDescriptionUk,
    shortDescriptionRu: product.shortDescriptionRu,
    descriptionUk: product.descriptionUk,
    descriptionRu: product.descriptionRu,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : undefined,
    stock: product.stock,
    sku: product.sku,
    brand: product.brand ?? "",
    categoryId: product.categoryId,
    supplierId: product.supplierId ?? undefined,
    supplierName: product.supplierName ?? undefined,
    images: product.images?.map((image) => image.imageUrl) ?? [],
    ingredientsUk: product.ingredientsUk,
    ingredientsRu: product.ingredientsRu,
    usageUk: product.usageUk,
    usageRu: product.usageRu,
    warningsUk: product.warningsUk,
    warningsRu: product.warningsRu,
    skinType: product.skinType ?? undefined,
    status: fromPrismaProductStatus(product.status),
    publicationStatus: fromPrismaPublicationStatus(product.publicationStatus),
    popularity: product.popularity,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    publishedAt: product.publishedAt?.toISOString(),
    priceUpdatedAt: product.priceUpdatedAt?.toISOString(),
    badgeUk: product.badgeUk ?? undefined,
    badgeRu: product.badgeRu ?? undefined,
    seo: toRecord(product.seo) as ProductPreview["seo"],
    tone: fromPrismaVisualTone(product.tone),
    attributes:
      product.attributeValues?.map((attribute) => ({
        definitionId: attribute.definitionId,
        value: fromPrismaAttributeValue(attribute),
        valueUk: attribute.valueUk ?? undefined,
        valueRu: attribute.valueRu ?? undefined,
      })) ?? [],
    variants:
      product.variants?.map((variant) => ({
        id: variant.id,
        optionType: toProductVariantOptionType(variant.optionType),
        optionNameUk: variant.optionNameUk ?? undefined,
        optionNameRu: variant.optionNameRu ?? undefined,
        labelUk: variant.labelUk,
        labelRu: variant.labelRu,
        colorHex: variant.colorHex ?? undefined,
        sku: variant.sku ?? undefined,
        price: Number(variant.price),
        salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
        stock: variant.stock,
        image: variant.imageUrl ?? undefined,
        isDefault: variant.isDefault,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
      })) ?? [],
    comboOffers:
      product.comboOffers?.map((offer) => ({
        id: offer.id,
        targetProductId: offer.targetProductId,
        targetProductIds: toArray(offer.targetProductIds).filter(
          (item): item is string => typeof item === "string",
        ),
        titleUk: offer.titleUk ?? undefined,
        titleRu: offer.titleRu ?? undefined,
        descriptionUk: offer.descriptionUk ?? undefined,
        descriptionRu: offer.descriptionRu ?? undefined,
        discountPercent: offer.discountPercent,
        sortOrder: offer.sortOrder,
        isActive: offer.isActive,
      })) ?? [],
  };
}

function mapAttributeDefinition(definition: {
  id: string;
  slug: string;
  nameUk: string;
  nameRu: string;
  type: AttributeType;
  isFilterable: boolean;
  sortOrder: number;
  categories?: Array<{ categoryId: string }>;
}): ProductAttributeDefinition {
  return {
    id: definition.id,
    slug: definition.slug,
    nameUk: definition.nameUk,
    nameRu: definition.nameRu,
    type: fromPrismaAttributeType(definition.type),
    isFilterable: definition.isFilterable,
    categoryIds: definition.categories?.map((item) => item.categoryId),
    sortOrder: definition.sortOrder,
  };
}

function mapProductFeedback(review: {
  id: string;
  productId: string;
  customerId: string | null;
  type: FeedbackType;
  status: ReviewStatus;
  rating: number | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  comment: string;
  adminReply: string | null;
  adminRepliedAt: Date | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: Array<{
    id: string;
    feedbackId: string;
    customerId: string | null;
    status: ReviewStatus;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): ProductReview {
  return {
    id: review.id,
    productId: review.productId,
    customerId: review.customerId ?? undefined,
    type: review.type === FeedbackType.QUESTION ? "question" : "review",
    status: fromPrismaReviewStatus(review.status),
    rating: review.rating ?? undefined,
    customerName: review.customerName,
    customerEmail: review.customerEmail ?? undefined,
    customerPhone: review.customerPhone ?? undefined,
    comment: review.comment,
    adminReply: review.adminReply ?? undefined,
    adminRepliedAt: review.adminRepliedAt?.toISOString(),
    isVerifiedPurchase: review.isVerifiedPurchase,
    replies:
      review.replies?.map((reply) => ({
        id: reply.id,
        reviewId: reply.feedbackId,
        customerId: reply.customerId ?? undefined,
        status: fromPrismaReviewStatus(reply.status),
        customerName: reply.customerName,
        customerEmail: reply.customerEmail ?? undefined,
        customerPhone: reply.customerPhone ?? undefined,
        comment: reply.comment,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
      })) ?? [],
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

function mapCoupon(coupon: {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  value: Prisma.Decimal;
  endsAt: Date | null;
  usageLimit: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Coupon {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType:
      coupon.discountType === CouponDiscountType.FIXED ? "fixed" : "percent",
    discountValue: Number(coupon.value),
    isActive: coupon.isActive,
    expiresAt: coupon.endsAt?.toISOString().slice(0, 10) ?? "",
    usageLimit: coupon.usageLimit ?? undefined,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

function mapOrder(order: {
  publicId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  locale: string;
  status: string;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider | null;
  subtotal: Prisma.Decimal;
  discountTotal: Prisma.Decimal;
  couponCode: string | null;
  deliveryFee: Prisma.Decimal;
  total: Prisma.Decimal;
  comment: string | null;
  deliveryMethod: string | null;
  paymentMethod: string | null;
  city: string | null;
  warehouse: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    productId: string | null;
    supplierId: string | null;
    productNameUk: string;
    productNameRu: string;
    sku: string | null;
    variantId: string | null;
    variantLabelUk: string | null;
    variantLabelRu: string | null;
    variantSku: string | null;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }>;
  shipments?: Array<{
    id: string;
    supplierId: string | null;
    status: ShipmentStatus;
    carrier: string;
    ttn: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  paymentTransactions?: Array<{ id: string; externalId: string | null; rawPayload: Prisma.JsonValue }>;
}): MockOrder {
  return {
    id: order.publicId,
    customerName: order.customerName ?? "",
    phone: order.customerPhone ?? "",
    email: order.customerEmail ?? "",
    city: order.city ?? "",
    novaPoshtaBranch: order.warehouse ?? "",
    deliveryMethod: (order.deliveryMethod as DeliveryMethod) ?? "nova_poshta",
    paymentMethod: (order.paymentMethod as PaymentMethod) ?? "cash_on_delivery",
    paymentProvider: order.paymentProvider
      ? order.paymentProvider === PaymentProvider.LIQPAY
        ? "liqpay"
        : "manual"
      : undefined,
    paymentStatus: fromPrismaPaymentStatus(order.paymentStatus),
    paymentId: order.paymentTransactions?.[0]?.externalId ?? undefined,
    paymentAmount: Number(order.total),
    paymentCurrency: "UAH",
    paymentRawResponse: getPaymentMessage(order.paymentTransactions?.[0]?.rawPayload),
    status: fromPrismaOrderStatus(order.status),
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    couponCode: order.couponCode ?? undefined,
    deliveryPrice: Number(order.deliveryFee),
    total: Number(order.total),
    comment: order.comment ?? "",
    items:
      order.items?.map((item) => ({
        productId: item.productId ?? item.sku ?? "",
        variantId: item.variantId ?? undefined,
        nameUk: item.productNameUk,
        nameRu: item.productNameRu,
        sku: item.sku ?? "",
        variantLabelUk: item.variantLabelUk ?? undefined,
        variantLabelRu: item.variantLabelRu ?? undefined,
        variantSku: item.variantSku ?? undefined,
        supplierId: item.supplierId ?? undefined,
        price: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })) ?? [],
    shipments:
      order.shipments?.map((shipment) => ({
        id: shipment.id,
        orderId: order.publicId,
        supplierId: shipment.supplierId ?? "unassigned",
        deliveryProvider: (shipment.carrier as DeliveryProvider) || "nova_poshta",
        ttnNumber: shipment.ttn ?? "",
        deliveryStatus: fromPrismaShipmentStatus(shipment.status),
        notificationStatus: "not_sent",
        customerNotificationStatus: "not_sent",
        notificationLog: shipment.notes ? shipment.notes.split("\n") : [],
        createdAt: shipment.createdAt.toISOString(),
        updatedAt: shipment.updatedAt.toISOString(),
      })) ?? [],
    locale: order.locale === "ru" ? "ru" : "uk",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function mapCustomer(customer: {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): CustomerAccount {
  return {
    id: customer.id,
    name: customer.name ?? "",
    email: customer.email,
    passwordHash: "",
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

function mapDeliveryPaymentSettings(
  value: Prisma.JsonValue | undefined,
  fallback: DeliveryPaymentSettings,
) {
  if (isRecord(value)) {
    return { ...fallback, ...value } as DeliveryPaymentSettings;
  }

  return fallback;
}

function mapSupplierWrite(supplier: Supplier) {
  return {
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
  };
}

function mapProductWrite(product: ProductPreview) {
  return {
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
    status: toPrismaProductStatus(product.status),
    publicationStatus: toPrismaPublicationStatus(product.publicationStatus),
    popularity: product.popularity,
    badgeUk: product.badgeUk,
    badgeRu: product.badgeRu,
    seo: product.seo ?? {},
    tone: toPrismaVisualTone(product.tone),
    publishedAt: toDate(product.publishedAt),
    priceUpdatedAt: toDate(product.priceUpdatedAt),
  };
}

function mapReviewWrite(review: ProductReview) {
  return {
    productId: review.productId,
    type: review.type === "question" ? FeedbackType.QUESTION : FeedbackType.REVIEW,
    status: toPrismaReviewStatus(review.status),
    rating: review.rating,
    customerName: review.customerName,
    customerEmail: review.customerEmail,
    customerPhone: review.customerPhone,
    comment: review.comment,
    adminReply: review.adminReply,
    adminRepliedAt: toDate(review.adminRepliedAt),
    isVerifiedPurchase: review.isVerifiedPurchase,
  };
}

function mapCouponWrite(coupon: Coupon) {
  return {
    code: coupon.code,
    discountType:
      coupon.discountType === "fixed"
        ? CouponDiscountType.FIXED
        : CouponDiscountType.PERCENT,
    value: coupon.discountValue,
    endsAt: coupon.expiresAt ? new Date(coupon.expiresAt) : undefined,
    usageLimit: coupon.usageLimit,
    isActive: coupon.isActive,
  };
}

function mapOrderWrite(order: MockOrder) {
  return {
    customerName: order.customerName,
    customerPhone: order.phone,
    customerEmail: order.email,
    locale: order.locale,
    status: toPrismaOrderStatus(order.status),
    paymentStatus: toPrismaPaymentStatus(order.paymentStatus),
    paymentProvider:
      order.paymentProvider === "liqpay" ? PaymentProvider.LIQPAY : PaymentProvider.MANUAL,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal ?? 0,
    couponCode: order.couponCode ?? null,
    deliveryFee: order.deliveryPrice,
    total: order.total,
    comment: order.comment,
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod,
    city: order.city,
    warehouse: order.novaPoshtaBranch,
  };
}

function toLocalizedText(value: Prisma.JsonValue, fallback: LocalizedText) {
  return { ...fallback, ...toRecord(value) } as LocalizedText;
}

function toRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function toArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value : [];
}

function isHeroMediaSlides(value: unknown): value is HeroMediaSlide[] {
  return Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toPrismaVisualTone(tone: StoreVisualTone | undefined) {
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

function fromPrismaVisualTone(tone: VisualTone): StoreVisualTone {
  switch (tone) {
    case VisualTone.ROSE:
      return "rose";
    case VisualTone.SAGE:
      return "sage";
    case VisualTone.LINEN:
      return "linen";
    default:
      return "cream";
  }
}

function toPrismaProductStatus(status: StoreProductStatus) {
  switch (status) {
    case "draft":
      return ProductStatus.DRAFT;
    case "out_of_stock":
      return ProductStatus.OUT_OF_STOCK;
    default:
      return ProductStatus.ACTIVE;
  }
}

function fromPrismaProductStatus(status: ProductStatus): StoreProductStatus {
  switch (status) {
    case ProductStatus.DRAFT:
      return "draft";
    case ProductStatus.OUT_OF_STOCK:
      return "out_of_stock";
    default:
      return "active";
  }
}

function toProductVariantOptionType(value: string | null | undefined) {
  if (
    value === "size" ||
    value === "color" ||
    value === "scent" ||
    value === "style" ||
    value === "other"
  ) {
    return value;
  }

  return "size";
}

function toPrismaPublicationStatus(status: ProductPreview["publicationStatus"]) {
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

function fromPrismaPublicationStatus(status: ProductPublicationStatus) {
  switch (status) {
    case ProductPublicationStatus.DRAFT:
      return "draft";
    case ProductPublicationStatus.PENDING_REVIEW:
      return "pending_review";
    case ProductPublicationStatus.ARCHIVED:
      return "archived";
    default:
      return "published";
  }
}

function toPrismaAttributeType(type: ProductAttributeDefinition["type"]) {
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

function fromPrismaAttributeType(type: AttributeType) {
  switch (type) {
    case AttributeType.NUMBER:
      return "number";
    case AttributeType.BOOLEAN:
      return "boolean";
    case AttributeType.SELECT:
      return "select";
    case AttributeType.MULTISELECT:
      return "multiselect";
    default:
      return "text";
  }
}

function toPrismaAttributeValue(value: ProductAttributeValue["value"]) {
  if (Array.isArray(value)) {
    return { valueJson: value };
  }

  if (typeof value === "number") {
    return { valueNumber: value };
  }

  if (typeof value === "boolean") {
    return { valueBoolean: value };
  }

  return { valueString: String(value) };
}

function fromPrismaAttributeValue(attribute: {
  valueString: string | null;
  valueNumber: Prisma.Decimal | null;
  valueBoolean: boolean | null;
  valueJson: Prisma.JsonValue;
}) {
  if (attribute.valueJson !== null && Array.isArray(attribute.valueJson)) {
    return attribute.valueJson.filter((item): item is string => typeof item === "string");
  }

  if (attribute.valueNumber !== null) {
    return Number(attribute.valueNumber);
  }

  if (attribute.valueBoolean !== null) {
    return attribute.valueBoolean;
  }

  return attribute.valueString ?? "";
}

function toPrismaReviewStatus(status: ProductReviewStatus) {
  switch (status) {
    case "approved":
      return ReviewStatus.APPROVED;
    case "rejected":
      return ReviewStatus.REJECTED;
    default:
      return ReviewStatus.PENDING;
  }
}

function fromPrismaReviewStatus(status: ReviewStatus): ProductReviewStatus {
  switch (status) {
    case ReviewStatus.APPROVED:
      return "approved";
    case ReviewStatus.REJECTED:
      return "rejected";
    default:
      return "pending";
  }
}

function toPrismaOrderStatus(status: MockOrderStatus) {
  if (status === "confirmed") {
    return OrderStatus.CONFIRMED;
  }
  if (status === "shipped") {
    return OrderStatus.SHIPPED;
  }
  if (status === "delivered") {
    return OrderStatus.COMPLETED;
  }
  if (status === "cancelled") {
    return OrderStatus.CANCELLED;
  }
  if (status === "returned") {
    return OrderStatus.REFUNDED;
  }
  if (status === "packed") {
    return OrderStatus.PROCESSING;
  }
  return OrderStatus.NEW;
}

function fromPrismaOrderStatus(status: string): MockOrderStatus {
  switch (status) {
    case "CONFIRMED":
      return "confirmed";
    case "PROCESSING":
      return "packed";
    case "SHIPPED":
      return "shipped";
    case "COMPLETED":
      return "delivered";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "returned";
    default:
      return "new";
  }
}

function toPrismaPaymentStatus(status: MockOrder["paymentStatus"]) {
  switch (status) {
    case "paid":
      return PaymentStatus.PAID;
    case "failed":
      return PaymentStatus.FAILED;
    case "cancelled":
      return PaymentStatus.CANCELLED;
    case "refunded":
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.PENDING;
  }
}

function fromPrismaPaymentStatus(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return "paid";
    case PaymentStatus.FAILED:
      return "failed";
    case PaymentStatus.CANCELLED:
      return "cancelled";
    case PaymentStatus.REFUNDED:
      return "refunded";
    default:
      return "pending";
  }
}

function toPrismaShipmentStatus(status: DeliveryStatus) {
  switch (status) {
    case "shipped":
      return ShipmentStatus.SHIPPED;
    case "delivered":
      return ShipmentStatus.DELIVERED;
    case "cancelled":
      return ShipmentStatus.CANCELLED;
    case "preparing":
    case "ttn_received":
      return ShipmentStatus.READY;
    default:
      return ShipmentStatus.PENDING;
  }
}

function fromPrismaShipmentStatus(status: ShipmentStatus): DeliveryStatus {
  switch (status) {
    case ShipmentStatus.READY:
      return "ttn_received";
    case ShipmentStatus.SHIPPED:
      return "shipped";
    case ShipmentStatus.DELIVERED:
      return "delivered";
    case ShipmentStatus.CANCELLED:
      return "cancelled";
    default:
      return "pending";
  }
}

function getPaymentMessage(payload: Prisma.JsonValue | undefined) {
  return isRecord(payload) && typeof payload.message === "string"
    ? payload.message
    : undefined;
}

function toDate(value: string | undefined) {
  return value ? new Date(value) : undefined;
}
