# Rytm Environment Setup

Rytm should use the same codebase for local pre-launch testing and production. Localhost can use real service credentials where available, and missing optional credentials should keep the app usable through manual or logged admin-side flows.

Important rules:

- Keep `.env.local` private. Do not commit real secrets.
- Only `NEXT_PUBLIC_` variables may be read by client components.
- All non-`NEXT_PUBLIC_` values must stay server-side.
- `NEXT_PUBLIC_` values are baked in when `npm run build` runs, so set analytics IDs before building.
- Customer-facing pages must not show setup, missing-key, simulated, local, or development wording.

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill only the services you want to test locally.
3. Use localhost URLs while testing:

```bash
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
LIQPAY_CALLBACK_URL=http://localhost:3000/api/payments/liqpay/callback
LIQPAY_RESULT_URL=http://localhost:3000/api/payments/liqpay/result
LIQPAY_SANDBOX=true
```

4. Run:

```bash
npm install
npm run dev
```

5. Open `http://localhost:3000/uk`.

Local testing can start with no paid service credentials. After the database phase, add `DATABASE_URL` and `DIRECT_URL` to test PostgreSQL-backed persistence locally.

## Production On Hostinger

Set the same variables in Hostinger Node.js Apps or on the VPS process environment. Replace localhost URLs with the real domain:

```bash
AUTH_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
LIQPAY_CALLBACK_URL=https://your-domain.com/api/payments/liqpay/callback
LIQPAY_RESULT_URL=https://your-domain.com/api/payments/liqpay/result
LIQPAY_SANDBOX=false
```

Typical production commands:

```bash
npm ci
npm run build
npm run start
```

After Prisma is added, initialize a local or Supabase PostgreSQL database:

```bash
# Local development
npm run db:migrate
npm run db:seed

# Hostinger or production
npm run db:deploy
npm run db:seed
```

Use `npm run db:migrate` for local development so Prisma can create and apply migrations. Use `npm run db:deploy` on Hostinger/production after the migration files are already in the project. Run seed only when initializing or intentionally refreshing starter data.

## Required Variables

Required for local database testing after the database phase:

- `DATABASE_URL`: app/runtime PostgreSQL URL. Supabase pooled URLs are fine here.
- `DIRECT_URL`: direct PostgreSQL URL for Prisma migrations and seed.

Required for production launch after the database phase:

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_SESSION_SECRET`
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_URL`

Required only when a provider is enabled:

- Local image upload: `IMAGE_STORAGE_PROVIDER=local`, optional `LOCAL_UPLOAD_DIR`, optional `LOCAL_UPLOAD_PUBLIC_BASE_URL`
- Cloudinary: `IMAGE_STORAGE_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Supabase Storage: `IMAGE_STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- UploadThing: `IMAGE_STORAGE_PROVIDER=uploadthing`, `UPLOADTHING_TOKEN`
- LiqPay: `PAYMENT_PROVIDER=liqpay`, `LIQPAY_PUBLIC_KEY`, `LIQPAY_PRIVATE_KEY`, `LIQPAY_CALLBACK_URL`, `LIQPAY_RESULT_URL`
- Nova Poshta API: `NOVA_POSHTA_API_KEY`
- Admin Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`
- Customer Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`
- Resend email: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `FROM_EMAIL`
- SMTP email: `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`
- TurboSMS: `SMS_PROVIDER=turbosms`, `TURBOSMS_API_TOKEN`, `SMS_SENDER_NAME`
- AlphaSMS: `SMS_PROVIDER=alphasms`, `ALPHASMS_API_TOKEN`, `SMS_SENDER_NAME`

## Optional Or Safe Fallback Variables

These can stay empty during local development:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `LIQPAY_PUBLIC_KEY`
- `LIQPAY_PRIVATE_KEY`
- `NOVA_POSHTA_API_KEY`
- `SMS_PROVIDER`
- `TURBOSMS_API_TOKEN`
- `ALPHASMS_API_TOKEN`
- `EMAIL_PROVIDER`
- `RESEND_API_KEY`
- `SMTP_*`
- `TURNSTILE_*`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

Safe fallback behavior:

- Missing LiqPay keys keep payment in pending/manual mode.
- Missing Nova Poshta API keeps manual/default delivery fields available.
- Missing email/SMS/Viber credentials keep notifications logged in admin-side flows.
- Missing image provider credentials keep URL fields usable. `IMAGE_STORAGE_PROVIDER=local` works immediately for local testing and Node hosting by saving files under `public/uploads`.
- Missing Google credentials disable admin login unless a temporary local password
  fallback is explicitly enabled with `ADMIN_PASSWORD_LOGIN_ENABLED=true`.
  Customer email/password login remains available.

## Service Activation

When the related phase is implemented, adding credentials should activate these features without code changes:

- `DATABASE_URL` and `DIRECT_URL` activate PostgreSQL persistence after migrations.
- `IMAGE_STORAGE_PROVIDER` controls admin image uploads. `local` works without external keys; `cloudinary`, `supabase`, and `uploadthing` activate after adding their server-side credentials.
- `LIQPAY_*` values activate LiqPay checkout and callback verification.
- `NOVA_POSHTA_API_KEY` activates city and warehouse selection.
- `EMAIL_PROVIDER` credentials activate real email sending.
- `SMS_PROVIDER` credentials activate real SMS/Viber sending according to provider support.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` activate Google admin login when `ADMIN_EMAIL` is set.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `DATABASE_URL` activate customer Google login.

## Localhost To Domain Checklist

Before deployment, update:

- `AUTH_URL`: `http://localhost:3000` to `https://your-domain.com`
- `NEXTAUTH_URL`: `http://localhost:3000` to `https://your-domain.com`
- `LIQPAY_CALLBACK_URL`: localhost callback to production callback URL
- `LIQPAY_RESULT_URL`: localhost result to production result URL
- `LIQPAY_SANDBOX`: `true` to `false` when using production LiqPay keys
- Google OAuth admin redirect URI: `/api/auth/google/callback`
- Google OAuth customer redirect URI: `/api/auth/customer/google/callback`

## Secret Handling

Never expose these through `NEXT_PUBLIC_` or client components:

- `DATABASE_URL`
- `DIRECT_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `LIQPAY_PRIVATE_KEY`
- `CLOUDINARY_API_SECRET`
- `UPLOADTHING_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOVA_POSHTA_API_KEY`
- `TURBOSMS_API_TOKEN`
- `ALPHASMS_API_TOKEN`
- `RESEND_API_KEY`
- `SMTP_PASSWORD`
- `TURNSTILE_SECRET_KEY`

Only analytics IDs with `NEXT_PUBLIC_` are intended for browser exposure.
