# Rytm VPS Deployment Guide

Rytm is intended to run on one VPS with:

- the Next.js Node.js app
- PostgreSQL on localhost
- local admin uploads in `public/uploads`
- Nginx/HTTPS in front of the Node process

Do not deploy the site as static files only. Do not use `npm run dev` for the
public production site.

## Required Environment Variables

Create `.env` on the server from `.env.example`. Never commit `.env`, database
dumps, customer exports, or uploaded private files.

At minimum, production needs:

```env
DATABASE_URL=postgresql://rytm:CHANGE_ME@127.0.0.1:5432/rytm?schema=public
DIRECT_URL=postgresql://rytm:CHANGE_ME@127.0.0.1:5432/rytm?schema=public

AUTH_URL=https://YOUR_DOMAIN
NEXTAUTH_URL=https://YOUR_DOMAIN
AUTH_SECRET=long-random-secret
NEXTAUTH_SECRET=long-random-secret

ADMIN_EMAIL=owner@example.com
ADMIN_SESSION_SECRET=another-long-random-secret

GOOGLE_CLIENT_ID=google-client-id
GOOGLE_CLIENT_SECRET=google-client-secret

PAYMENT_PROVIDER=monopay
MONOPAY_TOKEN=
MONOPAY_PUBLIC_BASE_URL=https://YOUR_DOMAIN
MONOPAY_WEBHOOK_URL=https://YOUR_DOMAIN/api/payments/monopay/callback
MONOPAY_RESULT_URL=https://YOUR_DOMAIN/api/payments/monopay/result

IMAGE_STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=public/uploads
LOCAL_UPLOAD_PUBLIC_BASE_URL=/uploads

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailbox@YOUR_DOMAIN
SMTP_PASSWORD=
FROM_NAME=Rytm
FROM_EMAIL=mailbox@YOUR_DOMAIN
```

## Deployment Commands

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
pm2 start npm --name rytm -- start
pm2 save
```

`npm run db:deploy` applies Prisma migrations. `npm run db:seed` loads the
current store data into the local PostgreSQL database.

## Short Update Command

After the server has pulled the version that includes the deploy script, later
updates can use one command from the project directory:

```bash
npm run deploy:server
```

It runs `git pull --ff-only`, `npm ci`, `npm run db:deploy`,
`npm run db:repair`, `npm run db:doctor`, `npm run build`, and
`systemctl restart rytm-web`.

If the project path or service name is different:

```bash
APP_DIR=/home/sites/rytm SERVICE_NAME=rytm-web npm run deploy:server
```

For first-time seed data only:

```bash
RUN_SEED=true npm run deploy:server
```

If the production database already has products but the homepage is blank, seed
only the homepage sections:

```bash
npm run db:seed:homepage
systemctl restart rytm-web
```

## Local Uploaded Images

Local uploads are written to:

```txt
public/uploads
```

Public image URLs are served as:

```txt
/uploads/product/...
```

Make `public/uploads` persistent and writable on the server. If deployments
replace the whole project directory, back up this folder before deploying and
restore it afterward.

## Security Checklist

- Use HTTPS only.
- Keep `.env`, `.data`, database dumps, and `public/uploads` out of Git.
- Use long random values for `AUTH_SECRET`, `NEXTAUTH_SECRET`, and
  `ADMIN_SESSION_SECRET`.
- Confirm `/admin/login` accepts only the configured Google account.
- Keep `ADMIN_PASSWORD_LOGIN_ENABLED=false` in production.
- Restrict PostgreSQL to localhost.
- Run a test checkout and verify the order appears in `/admin/orders`.
