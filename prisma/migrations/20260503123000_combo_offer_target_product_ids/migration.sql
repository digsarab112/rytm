ALTER TABLE "product_combo_offers"
ADD COLUMN "targetProductIds" JSONB NOT NULL DEFAULT '[]';
