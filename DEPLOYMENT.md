# Low-Cost Deployment

Rytm should run as a standard Next.js Node.js app. Do not use static export.

## A. Hostinger Node.js Apps + Supabase/Neon PostgreSQL

1. Create a Supabase or Neon free PostgreSQL database.
2. Put the connection string into `DATABASE_URL`.
3. In Hostinger Node.js Apps, upload/connect the project and set environment variables from `.env.example`.
4. Install dependencies:

```bash
npm ci
```

5. Build:

```bash
npm run build
```

6. Start:

```bash
npm run start
```

Apply Prisma migrations and seed starter store data:

```bash
npm run db:deploy
npm run db:seed
```

Production admin access requires Google OAuth. Set `ADMIN_EMAIL`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL`, and
`ADMIN_SESSION_SECRET`. Keep `ADMIN_PASSWORD_LOGIN_ENABLED=false` in production.

Optional launch services can remain manual or logged until keys are added: LiqPay, Nova Poshta API, SMS/Viber, email, analytics, and Turnstile. Image uploads work with `IMAGE_STORAGE_PROVIDER=local` immediately, or with Cloudinary, UploadThing, or Supabase Storage after adding provider credentials.

## B. Hostinger VPS + Local PostgreSQL

1. Install Node.js LTS, PostgreSQL, and a process manager such as PM2.
2. Create a PostgreSQL database and user.
3. Set `DATABASE_URL` to the local PostgreSQL connection string.
4. Run `npm ci`, `npm run build`, migrations, and `npm run start` through PM2.
5. Put Nginx or another reverse proxy in front of the Node process with HTTPS.

## C. Vercel + External PostgreSQL

Vercel is optional. Use Supabase/Neon for PostgreSQL and set the same environment variables in Vercel project settings.

The app should not depend on Vercel-only features. Keep the normal scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```
