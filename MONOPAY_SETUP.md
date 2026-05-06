# Monopay Payment Setup

Rytm uses monobank acquiring for online payments through Monopay invoices. The
store creates the order in the local PostgreSQL database first, then asks
monobank for an invoice and redirects the customer to the returned payment page.

## Environment Variables

```bash
PAYMENT_PROVIDER=monopay
MONOPAY_TOKEN=
MONOPAY_PUBLIC_BASE_URL=https://YOUR_DOMAIN
MONOPAY_WEBHOOK_URL=https://YOUR_DOMAIN/api/payments/monopay/callback
MONOPAY_RESULT_URL=https://YOUR_DOMAIN/api/payments/monopay/result
MONOPAY_VALIDITY_SECONDS=86400
```

`MONOPAY_TOKEN` must stay server-side. Do not expose it through `NEXT_PUBLIC_`
or client components.

## Flow

1. Customer chooses online payment at checkout.
2. The order is saved in PostgreSQL with pending payment status.
3. `lib/integrations/payments/monopay.ts` creates a monobank invoice.
4. The customer is redirected to the Monopay payment page.
5. `/api/payments/monopay/callback` verifies the `X-Sign` webhook signature and
   updates the local order/payment status.
6. `/api/payments/monopay/result` returns the customer to the order success page.

Cash on delivery and card on delivery remain available for manual operations.
