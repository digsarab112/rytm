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
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_status_createdAt_idx" ON "newsletter_subscriptions"("status", "createdAt");
