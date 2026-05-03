-- Add product variants for selectable product sizes/options.
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "labelUk" TEXT NOT NULL,
    "labelRu" TEXT NOT NULL,
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

CREATE INDEX "product_variants_productId_isActive_sortOrder_idx" ON "product_variants"("productId", "isActive", "sortOrder");
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

ALTER TABLE "product_variants"
ADD CONSTRAINT "product_variants_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
ADD COLUMN "variantId" TEXT,
ADD COLUMN "variantLabelUk" TEXT,
ADD COLUMN "variantLabelRu" TEXT,
ADD COLUMN "variantSku" TEXT;
