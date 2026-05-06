# Single VPS Deployment

Rytm is a standard Next.js Node.js app with PostgreSQL and local image uploads
on the same server. Do not deploy it as static files and do not run
`npm run dev` in production.

## Server Requirements

- Ubuntu/Debian VPS or equivalent
- Node.js LTS
- PostgreSQL on the same server
- PM2 or another process manager
- Nginx reverse proxy with HTTPS

## Environment

Create `.env` on the server from `.env.example`:

```bash
cp .env.example .env
nano .env
```

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
```

## PostgreSQL

Create a local database and user:

```bash
sudo -u postgres psql
```

```sql
CREATE USER rytm WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE rytm OWNER rytm;
\q
```

Use that password in `DATABASE_URL` and `DIRECT_URL`.

## Deploy Commands

From the project directory on the server:

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
pm2 start npm --name rytm -- start
pm2 save
```

For later code updates:

```bash
git pull
npm ci
npm run db:deploy
npm run build
pm2 restart rytm
```

Run `npm run db:seed` only when initializing or intentionally refreshing store
data.

## Persistent Local Files

Keep these paths private and persistent on the server:

```txt
.env
.data/
public/uploads/
```

`public/uploads/` stores product/category/site images uploaded from the admin
panel. If your deployment process replaces the project folder, back up and
restore this directory or mount it as persistent storage.

## Production Checklist

- Run with `npm run start` through PM2, not `npm run dev`.
- Use HTTPS before enabling Monopay webhooks and Google login.
- Confirm `/admin/login` accepts only the configured Google account.
- Keep `ADMIN_PASSWORD_LOGIN_ENABLED=false`.
- Run a checkout and verify the order appears in `/admin/orders`.
- Upload an image in `/admin/products` and verify it remains after restart.
