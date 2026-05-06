# Rytm

Rytm is a configurable ecommerce storefront for the Ukrainian market. It runs
as a Next.js Node.js app with Prisma/PostgreSQL, admin-managed catalog content,
local image uploads, customer accounts, checkout, orders, coupons, reviews, and
provider-ready integrations.

## Production Shape

The launch target is one VPS:

- Next.js app served with `npm run start`
- PostgreSQL on the same server
- images stored in `public/uploads`
- Monopay for online payment invoices
- Google OAuth for admin login
- optional SMTP, SMS/Viber, Nova Poshta, analytics, and Turnstile keys

Do not deploy this project as static files. Do not run `npm run dev` in
production.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/uk`. Russian content is available at `/ru`.

## Production Commands

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
npm run start
```

Use PM2 or another process manager on the server.

## Checks

```bash
npm run lint
npm run build
```

## Launch Notes

- Configure `.env` from `.env.example` on the server.
- Keep `.env`, `.data`, database dumps, and `public/uploads` out of Git.
- `public/uploads` must be persistent across deployments.
- Admin login is Google-only in production. Keep
  `ADMIN_PASSWORD_LOGIN_ENABLED=false`.
- Monopay setup is documented in `MONOPAY_SETUP.md`.
- VPS deployment is documented in `DEPLOYMENT.md`.
- Image storage is documented in `IMAGE_STORAGE_SETUP.md`.
- Environment setup is documented in `SETUP_ENV.md`.
