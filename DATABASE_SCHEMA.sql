-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VisualTone" AS ENUM ('rose', 'sage', 'cream', 'linen');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'draft', 'out_of_stock');

-- CreateEnum
CREATE TYPE "ProductPublicationStatus" AS ENUM ('draft', 'pending_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('text', 'number', 'boolean', 'select', 'multiselect');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('review', 'question');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('pending', 'ready', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('manual', 'liqpay', 'other');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('percent', 'fixed');

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'site-settings',
    "storeName" TEXT NOT NULL DEFAULT 'Rytm',
    "logoText" TEXT,
    "faviconText" TEXT,
    "logoAsset" TEXT,
    "faviconAsset" TEXT,
    "slogan" JSONB NOT NULL DEFAULT '{}',
    "description" JSONB NOT NULL DEFAULT '{}',
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "colors" JSONB NOT NULL DEFAULT '{}',
    "hero" JSONB NOT NULL DEFAULT '{}',
    "promoBanner" JSONB NOT NULL DEFAULT '{}',
    "footerText" JSONB NOT NULL DEFAULT '{}',
    "seo" JSONB NOT NULL DEFAULT '{}',
    "heroMediaSlides" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_visuals" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altUk" TEXT,
    "altRu" TEXT,
    "tone" "VisualTone" NOT NULL DEFAULT 'cream',
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_visuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_media_slides" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" JSONB NOT NULL DEFAULT '{}',
    "linkType" TEXT NOT NULL DEFAULT 'custom',
    "href" TEXT,
    "productId" TEXT,
    "productSlug" TEXT,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_media_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "nameUk" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "descriptionUk" TEXT NOT NULL DEFAULT '',
    "descriptionRu" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showInHeader" BOOLEAN NOT NULL DEFAULT false,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "showInCatalogNavigation" BOOLEAN NOT NULL DEFAULT true,
    "tone" "VisualTone" NOT NULL DEFAULT 'cream',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_images" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altUk" TEXT,
    "altRu" TEXT,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "novaPoshtaWarehouse" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supplierApiKey" TEXT,
    "supplierTelegram" TEXT,
    "supplierViber" TEXT,
    "supplierPaymentInfo" TEXT,
    "supplierCommissionType" TEXT,
    "supplierCommissionValue" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameUk" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "shortDescriptionUk" TEXT NOT NULL DEFAULT '',
    "shortDescriptionRu" TEXT NOT NULL DEFAULT '',
    "descriptionUk" TEXT NOT NULL DEFAULT '',
    "descriptionRu" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT NOT NULL,
    "brand" TEXT,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "ingredientsUk" TEXT NOT NULL DEFAULT '',
    "ingredientsRu" TEXT NOT NULL DEFAULT '',
    "usageUk" TEXT NOT NULL DEFAULT '',
    "usageRu" TEXT NOT NULL DEFAULT '',
    "warningsUk" TEXT NOT NULL DEFAULT '',
    "warningsRu" TEXT NOT NULL DEFAULT '',
    "skinType" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "publicationStatus" "ProductPublicationStatus" NOT NULL DEFAULT 'published',
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "badgeUk" TEXT,
    "badgeRu" TEXT,
    "seo" JSONB NOT NULL DEFAULT '{}',
    "tone" "VisualTone" NOT NULL DEFAULT 'cream',
    "publishedAt" TIMESTAMP(3),
    "priceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altUk" TEXT,
    "altRu" TEXT,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "optionType" TEXT DEFAULT 'size',
    "optionNameUk" TEXT,
    "optionNameRu" TEXT,
    "labelUk" TEXT NOT NULL,
    "labelRu" TEXT NOT NULL,
    "colorHex" TEXT,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_combo_offers" (
    "id" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "targetProductId" TEXT NOT NULL,
    "titleUk" TEXT,
    "titleRu" TEXT,
    "descriptionUk" TEXT,
    "descriptionRu" TEXT,
    "discountPercent" INTEGER NOT NULL DEFAULT 10,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_combo_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameUk" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_categories" (
    "definitionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_attribute_categories_pkey" PRIMARY KEY ("definitionId","categoryId")
);

-- CreateTable
CREATE TABLE "product_attribute_options" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueUk" TEXT,
    "valueRu" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attribute_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "valueString" TEXT,
    "valueNumber" DECIMAL(12,2),
    "valueBoolean" BOOLEAN,
    "valueJson" JSONB,
    "valueUk" TEXT,
    "valueRu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "passwordHash" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "provider" TEXT,
    "providerAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "patronymic" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "novaPoshtaCityRef" TEXT,
    "warehouse" TEXT,
    "novaPoshtaWarehouseRef" TEXT,
    "address" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_saved_products" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_saved_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "status" "OrderStatus" NOT NULL DEFAULT 'new',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentProvider" "PaymentProvider",
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "couponCode" TEXT,
    "comment" TEXT,
    "deliveryMethod" TEXT,
    "paymentMethod" TEXT,
    "city" TEXT,
    "warehouse" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "supplierId" TEXT,
    "productSlug" TEXT NOT NULL,
    "productNameUk" TEXT NOT NULL,
    "productNameRu" TEXT NOT NULL,
    "sku" TEXT,
    "variantId" TEXT,
    "variantLabelUk" TEXT,
    "variantLabelRu" TEXT,
    "variantSku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplierId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'pending',
    "fulfillmentType" TEXT NOT NULL DEFAULT 'manual',
    "carrier" TEXT NOT NULL DEFAULT 'nova_poshta',
    "city" TEXT,
    "warehouse" TEXT,
    "ttn" TEXT,
    "trackingUrl" TEXT,
    "notes" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_feedback" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "type" "FeedbackType" NOT NULL DEFAULT 'review',
    "status" "ReviewStatus" NOT NULL DEFAULT 'approved',
    "rating" INTEGER,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "comment" TEXT NOT NULL,
    "adminReply" TEXT,
    "adminRepliedAt" TIMESTAMP(3),
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_feedback_replies" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'approved',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_feedback_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "CouponDiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minOrderTotal" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" JSONB,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "variant" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_menu_items" (
    "id" TEXT NOT NULL,
    "label" JSONB NOT NULL DEFAULT '{}',
    "href" TEXT,
    "categoryId" TEXT,
    "placement" TEXT NOT NULL DEFAULT 'header',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_navigation_groups" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_navigation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_navigation_links" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" JSONB NOT NULL DEFAULT '{}',
    "href" TEXT,
    "categoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_navigation_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_payment_settings" (
    "id" TEXT NOT NULL DEFAULT 'delivery-payment',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "deliveryMethods" JSONB NOT NULL DEFAULT '[]',
    "paymentMethods" JSONB NOT NULL DEFAULT '[]',
    "freeDeliveryThreshold" DECIMAL(10,2),
    "regions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "externalId" TEXT,
    "checkoutUrl" TEXT,
    "rawPayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT,
    "channel" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL,
    "recipient" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_visuals_key_key" ON "site_visuals"("key");

-- CreateIndex
CREATE INDEX "hero_media_slides_isActive_sortOrder_idx" ON "hero_media_slides"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "hero_media_slides_productId_idx" ON "hero_media_slides"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "category_images_categoryId_sortOrder_idx" ON "category_images"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- CreateIndex
CREATE INDEX "products_status_publicationStatus_idx" ON "products"("status", "publicationStatus");

-- CreateIndex
CREATE INDEX "product_images_productId_sortOrder_idx" ON "product_images"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "product_variants_productId_isActive_sortOrder_idx" ON "product_variants"("productId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_combo_offers_sourceProductId_isActive_sortOrder_idx" ON "product_combo_offers"("sourceProductId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "product_combo_offers_targetProductId_idx" ON "product_combo_offers"("targetProductId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_definitions_slug_key" ON "product_attribute_definitions"("slug");

-- CreateIndex
CREATE INDEX "product_attribute_definitions_isFilterable_sortOrder_idx" ON "product_attribute_definitions"("isFilterable", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_options_definitionId_value_key" ON "product_attribute_options"("definitionId", "value");

-- CreateIndex
CREATE INDEX "product_attribute_values_definitionId_idx" ON "product_attribute_values"("definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_productId_definitionId_key" ON "product_attribute_values"("productId", "definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_provider_providerAccountId_key" ON "customers"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_customerId_key" ON "customer_profiles"("customerId");

-- CreateIndex
CREATE INDEX "customer_saved_products_productId_idx" ON "customer_saved_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_saved_products_customerId_productId_key" ON "customer_saved_products"("customerId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_publicId_key" ON "orders"("publicId");

-- CreateIndex
CREATE INDEX "orders_customerId_createdAt_idx" ON "orders"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_items_supplierId_idx" ON "order_items"("supplierId");

-- CreateIndex
CREATE INDEX "shipments_orderId_idx" ON "shipments"("orderId");

-- CreateIndex
CREATE INDEX "shipments_supplierId_idx" ON "shipments"("supplierId");

-- CreateIndex
CREATE INDEX "shipments_ttn_idx" ON "shipments"("ttn");

-- CreateIndex
CREATE INDEX "product_feedback_productId_status_idx" ON "product_feedback"("productId", "status");

-- CreateIndex
CREATE INDEX "product_feedback_customerId_idx" ON "product_feedback"("customerId");

-- CreateIndex
CREATE INDEX "product_feedback_replies_feedbackId_status_createdAt_idx" ON "product_feedback_replies"("feedbackId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "product_feedback_replies_customerId_idx" ON "product_feedback_replies"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_isActive_startsAt_endsAt_idx" ON "coupons"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "homepage_sections_isVisible_sortOrder_idx" ON "homepage_sections"("isVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "storefront_menu_items_placement_isVisible_sortOrder_idx" ON "storefront_menu_items"("placement", "isVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "footer_navigation_groups_isVisible_sortOrder_idx" ON "footer_navigation_groups"("isVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "footer_navigation_links_groupId_sortOrder_idx" ON "footer_navigation_links"("groupId", "sortOrder");

-- CreateIndex
CREATE INDEX "payment_transactions_orderId_idx" ON "payment_transactions"("orderId");

-- CreateIndex
CREATE INDEX "payment_transactions_provider_status_idx" ON "payment_transactions"("provider", "status");

-- CreateIndex
CREATE INDEX "payment_transactions_externalId_idx" ON "payment_transactions"("externalId");

-- CreateIndex
CREATE INDEX "notification_logs_orderId_idx" ON "notification_logs"("orderId");

-- CreateIndex
CREATE INDEX "notification_logs_customerId_idx" ON "notification_logs"("customerId");

-- CreateIndex
CREATE INDEX "notification_logs_channel_status_idx" ON "notification_logs"("channel", "status");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_status_createdAt_idx" ON "newsletter_subscriptions"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "hero_media_slides" ADD CONSTRAINT "hero_media_slides_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_images" ADD CONSTRAINT "category_images_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_combo_offers" ADD CONSTRAINT "product_combo_offers_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_combo_offers" ADD CONSTRAINT "product_combo_offers_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_categories" ADD CONSTRAINT "product_attribute_categories_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "product_attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_categories" ADD CONSTRAINT "product_attribute_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_options" ADD CONSTRAINT "product_attribute_options_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "product_attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "product_attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_saved_products" ADD CONSTRAINT "customer_saved_products_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_saved_products" ADD CONSTRAINT "customer_saved_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedback" ADD CONSTRAINT "product_feedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedback" ADD CONSTRAINT "product_feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedback_replies" ADD CONSTRAINT "product_feedback_replies_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "product_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedback_replies" ADD CONSTRAINT "product_feedback_replies_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_menu_items" ADD CONSTRAINT "storefront_menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_navigation_links" ADD CONSTRAINT "footer_navigation_links_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "footer_navigation_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_navigation_links" ADD CONSTRAINT "footer_navigation_links_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
