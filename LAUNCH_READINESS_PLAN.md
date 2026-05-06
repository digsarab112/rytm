# Rytm Launch Readiness Plan

## Final Launch Target

Rytm should be launch-ready after production environment variables and API keys
are added. The target deployment is one VPS with the app, PostgreSQL, and image
uploads on the same server.

Guardrails:

- Do not redesign the store from scratch.
- Do not show customers setup, dev, local, placeholder, simulated, or
  not-connected wording.
- Business data must be PostgreSQL-backed in production.
- Cart state may remain in browser storage until checkout.
- Provider secrets must stay server-side.

## Completed Launch Direction

- PostgreSQL is the production data source.
- Admin image uploads use the local VPS filesystem under `public/uploads`.
- Monopay is the online payment provider.
- Cash/card on delivery remain available for manual operations.
- Google OAuth is the production admin login path.
- SMTP, SMS/Viber, Nova Poshta, analytics, and Turnstile are activated by
  server-side environment variables when needed.

## Remaining Operational Setup

These items are outside the codebase and must be configured on the server or in
provider dashboards:

- Local PostgreSQL database and user on the VPS.
- Persistent writable `public/uploads` directory.
- Domain and HTTPS.
- Google OAuth app with `/api/auth/google/callback`.
- Monopay merchant token and webhook/result URLs.
- SMTP mailbox if real transactional email is required.
- Nova Poshta API key if API-based city/warehouse search is required.
- SMS/Viber provider credentials if real customer notifications are required.

## Verification

Before launch:

- `npm run lint` passes.
- `npm run build` passes.
- `npm run db:deploy` succeeds on the VPS.
- `npm run db:seed` is run when initializing store data.
- The site runs with `npm run start`, not `npm run dev`.
- Admin login works with the configured Google account.
- Product/category image upload writes to `public/uploads` and survives restart.
- Checkout creates an order in `/admin/orders`.
- Monopay online checkout redirects to the payment page when `MONOPAY_TOKEN` is
  configured.
- Monopay webhook updates payment status in PostgreSQL.
