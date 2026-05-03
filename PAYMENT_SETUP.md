# LiqPay Payment Setup

Rytm is prepared for LiqPay as the main online payment provider.

Local development is safe without LiqPay credentials. Checkout creates orders with `paymentStatus = pending`, `paymentProvider = liqpay`, and a placeholder payment ID when LiqPay is selected.

## Environment Variables

```bash
LIQPAY_PUBLIC_KEY=
LIQPAY_PRIVATE_KEY=
LIQPAY_SANDBOX=true
LIQPAY_CALLBACK_URL=https://your-domain.com/api/payments/liqpay/callback
LIQPAY_RESULT_URL=https://your-domain.com/api/payments/liqpay/result
```

Keep `LIQPAY_PRIVATE_KEY` server-side only. Do not expose it through `NEXT_PUBLIC_` or client components.

## Prepared Flow

1. Customer chooses LiqPay at checkout.
2. Order is created with pending payment status.
3. `lib/integrations/payments/liqpay.ts` can create a signed LiqPay checkout payload when keys are configured.
4. `/api/payments/liqpay/callback` verifies callback signature and maps LiqPay status.
5. Database order update is intentionally left as a Prisma/PostgreSQL phase.

Cash on delivery and card on delivery remain available for launch/manual testing.
