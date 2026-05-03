-- Add product-level SEO controls for metadata, search ranking hints,
-- FAQ content, internal links, and structured data settings.
ALTER TABLE "products" ADD COLUMN "seo" JSONB NOT NULL DEFAULT '{}';
