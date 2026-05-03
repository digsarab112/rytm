-- Add full settings JSON for the existing admin delivery/payment configuration shape.
ALTER TABLE "delivery_payment_settings" ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}';
