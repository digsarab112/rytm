-- Publish new customer feedback immediately and let admins hide it later.
ALTER TABLE "product_feedback" ALTER COLUMN "status" SET DEFAULT 'approved';

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

-- CreateIndex
CREATE INDEX "product_feedback_replies_feedbackId_status_createdAt_idx" ON "product_feedback_replies"("feedbackId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "product_feedback_replies_customerId_idx" ON "product_feedback_replies"("customerId");

-- AddForeignKey
ALTER TABLE "product_feedback_replies" ADD CONSTRAINT "product_feedback_replies_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "product_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedback_replies" ADD CONSTRAINT "product_feedback_replies_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
