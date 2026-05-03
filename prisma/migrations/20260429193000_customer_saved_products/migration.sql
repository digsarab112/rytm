-- CreateTable
CREATE TABLE "customer_saved_products" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_saved_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_saved_products_customerId_productId_key" ON "customer_saved_products"("customerId", "productId");

-- CreateIndex
CREATE INDEX "customer_saved_products_productId_idx" ON "customer_saved_products"("productId");

-- AddForeignKey
ALTER TABLE "customer_saved_products" ADD CONSTRAINT "customer_saved_products_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_saved_products" ADD CONSTRAINT "customer_saved_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
