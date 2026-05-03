# Rytm Hostinger Deployment Guide

Rytm is a Next.js application that requires a Node.js runtime and PostgreSQL.
Do not deploy it as static files only. Use a Hostinger VPS or a Hostinger plan
that supports Node.js applications, and connect it to PostgreSQL either on the
same server or through a managed provider such as Supabase or Neon.

## Required Environment Variables

Create a `.env` file on the server from `.env.example`. Never commit `.env`,
`.env.local`, database dumps, customer exports, or uploaded private files.

At minimum, production needs:

```env
DATABASE_URL="paste-production-postgresql-url-here"
DIRECT_URL="paste-migration-postgresql-url-here"

AUTH_URL="https://YOUR_DOMAIN"
NEXTAUTH_URL="https://YOUR_DOMAIN"
AUTH_SECRET="long-random-secret"
NEXTAUTH_SECRET="long-random-secret"

ADMIN_EMAIL="owner@example.com"
ADMIN_SESSION_SECRET="another-long-random-secret"

GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"

IMAGE_STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=public/uploads
LOCAL_UPLOAD_PUBLIC_BASE_URL=/uploads
```

`ADMIN_EMAIL` is the only Google account allowed to access `/admin`.
Password admin login is disabled in production. Do not set or rely on
`ADMIN_PASSWORD` for a deployed store.

## Google Admin Login Setup

1. Open Google Cloud Console and create an OAuth client for a web application.
2. Add this authorized redirect URI:

```txt
https://YOUR_DOMAIN/api/auth/google/callback
```

3. Put the OAuth client values into:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

4. Set `ADMIN_EMAIL` to the exact email address of the owner/admin Google
account.
5. Test `/admin/login`. The page should show only Google login when Google is
configured.

## Deployment Commands

Run these commands on the server:

```bash
npm install
npm run db:deploy
npm run db:seed
npm run build
npm run start
```

`npm run db:deploy` applies Prisma migrations. `npm run db:seed` loads the
current store data: products, categories, combo offers, coupons, delivery and
payment settings, and product images.

## Local Uploaded Images

Local uploads are written to:

```txt
public/uploads
```

Public image URLs are served as:

```txt
/uploads/product/...
```

Make `public/uploads` persistent and writable on the server. If your deployment
process replaces the whole project directory, back up this folder before
deploying and restore it afterward, or mount it as persistent storage.

## Production Security Checklist

- Use HTTPS only.
- Keep `.env`, `.env.local`, `.data`, database dumps, and uploaded customer
files out of Git.
- Use long random values for `AUTH_SECRET`, `NEXTAUTH_SECRET`, and
`ADMIN_SESSION_SECRET`.
- Confirm `/admin/login` accepts only the configured Google account.
- Keep `ADMIN_PASSWORD_LOGIN_ENABLED=false` in production.
- Restrict database access to the app/server where possible.
- Run a test checkout, then verify the order appears in `/admin/orders`.
- Configure real email, SMS, or Viber providers before expecting live customer
notifications. Without provider credentials, notification actions are simulated
and logged only.
