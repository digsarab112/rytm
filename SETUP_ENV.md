# Rytm Environment Setup

Rytm uses the same codebase for local testing and production. Production is
designed for one VPS: the app, PostgreSQL, and uploaded images all live on the
same server.

Important rules:

- Keep `.env` and `.env.local` private.
- Only `NEXT_PUBLIC_` variables may be read by client components.
- Server secrets must stay server-side.
- `NEXT_PUBLIC_` values are baked in when `npm run build` runs.
- Customer-facing pages must not show setup or missing-key wording.

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill only the services you want to test locally.
3. Use localhost URLs while testing:

```bash
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
MONOPAY_PUBLIC_BASE_URL=http://localhost:3000
MONOPAY_WEBHOOK_URL=http://localhost:3000/api/payments/monopay/callback
MONOPAY_RESULT_URL=http://localhost:3000/api/payments/monopay/result
```

4. Run:

```bash
npm install
npm run dev
```

5. Open `http://localhost:3000/uk`.

Local testing can start without payment, email, SMS, or delivery API keys. The
checkout remains usable with manual/pending flows until credentials are added.

## Production On A Single VPS

Set the same variables in `.env` on the server. Replace localhost URLs with the
real HTTPS domain:

```bash
AUTH_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
MONOPAY_PUBLIC_BASE_URL=https://your-domain.com
MONOPAY_WEBHOOK_URL=https://your-domain.com/api/payments/monopay/callback
MONOPAY_RESULT_URL=https://your-domain.com/api/payments/monopay/result
```

Typical production commands:

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
npm run start
```

Use PM2 or another process manager for long-running production.

## Required Variables

Required for production:

- `DATABASE_URL`: runtime PostgreSQL URL for the local VPS database.
- `DIRECT_URL`: migration/seed PostgreSQL URL for the same database.
- `ADMIN_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_SESSION_SECRET`
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_URL`

Required only when a provider is enabled:

- Local image upload: `IMAGE_STORAGE_PROVIDER=local`, `LOCAL_UPLOAD_DIR`,
  `LOCAL_UPLOAD_PUBLIC_BASE_URL`
- Monopay: `PAYMENT_PROVIDER=monopay`, `MONOPAY_TOKEN`,
  `MONOPAY_PUBLIC_BASE_URL`, `MONOPAY_WEBHOOK_URL`, `MONOPAY_RESULT_URL`
- Nova Poshta API: `NOVA_POSHTA_API_KEY`
- Admin Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`
- Customer Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `DATABASE_URL`
- SMTP email: `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASSWORD`, `FROM_EMAIL`
- SMS providers: `SMS_PROVIDER`, provider token, `SMS_SENDER_NAME`

## Optional Or Safe Fallback Variables

These can stay empty during local development:

- `MONOPAY_TOKEN`
- `NOVA_POSHTA_API_KEY`
- `SMS_PROVIDER`
- `EMAIL_PROVIDER`
- `SMTP_*`
- `TURNSTILE_*`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

Safe fallback behavior:

- Missing Monopay token keeps online orders pending/manual instead of failing
  checkout.
- Missing Nova Poshta API keeps manual/default delivery fields available.
- Missing email/SMS credentials keep notifications logged in admin-side flows.
- Local image upload works with `IMAGE_STORAGE_PROVIDER=local`.
- Missing Google credentials disable admin Google login unless the temporary
  local password fallback is explicitly enabled.

## Localhost To Domain Checklist

Before deployment, update:

- `AUTH_URL`: `http://localhost:3000` to `https://your-domain.com`
- `NEXTAUTH_URL`: `http://localhost:3000` to `https://your-domain.com`
- `MONOPAY_PUBLIC_BASE_URL`: production origin
- `MONOPAY_WEBHOOK_URL`: production callback URL
- `MONOPAY_RESULT_URL`: production return URL
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
- `MONOPAY_TOKEN`
- `NOVA_POSHTA_API_KEY`
- `SMTP_PASSWORD`
- provider SMS tokens
- `TURNSTILE_SECRET_KEY`

Only analytics IDs with `NEXT_PUBLIC_` are intended for browser exposure.
