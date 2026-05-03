# Admin Authentication Setup

Admin routes are protected by an HTTP-only signed session cookie. In deployed
environments, admin access is Google-only.

## Production Rules

- Set `ADMIN_EMAIL` to the exact Google account that owns the admin panel.
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Set `AUTH_URL` and `NEXTAUTH_URL` to the public site URL.
- Set `ADMIN_SESSION_SECRET` to a long random secret.
- Keep `ADMIN_PASSWORD_LOGIN_ENABLED=false`.
- Do not rely on password login for production. It is disabled by code when
  `NODE_ENV=production`.

## Google OAuth Setup

1. Create a Google OAuth web application client in Google Cloud Console.
2. Add this authorized redirect URI:

```text
https://your-domain.com/api/auth/google/callback
```

3. Configure the server environment:

```bash
ADMIN_EMAIL=owner@example.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
ADMIN_SESSION_SECRET=
```

Only the verified Google profile whose email matches `ADMIN_EMAIL` can access
`/admin`.

## Local Testing

For local Google testing, add this redirect URI in Google Cloud:

```text
http://localhost:3000/api/auth/google/callback
```

Then set:

```bash
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=owner@example.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_SESSION_SECRET=
```

Password login is intended only as an explicit local fallback. To enable it
temporarily while developing, set all of these:

```bash
ADMIN_PASSWORD_LOGIN_ENABLED=true
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=temporary-local-password
```

Never enable password admin login in production.
