-- AlterTable
ALTER TABLE "product_variants"
ADD COLUMN "optionType" TEXT DEFAULT 'size',
ADD COLUMN "optionNameUk" TEXT,
ADD COLUMN "optionNameRu" TEXT,
ADD COLUMN "colorHex" TEXT;

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

-- CreateIndex
CREATE INDEX "product_combo_offers_sourceProductId_isActive_sortOrder_idx" ON "product_combo_offers"("sourceProductId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "product_combo_offers_targetProductId_idx" ON "product_combo_offers"("targetProductId");

-- AddForeignKey
ALTER TABLE "product_combo_offers" ADD CONSTRAINT "product_combo_offers_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_combo_offers" ADD CONSTRAINT "product_combo_offers_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
