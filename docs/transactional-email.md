# Transactional Email Setup

Rytm includes branded transactional email templates for:

- Customer account registration.
- Order confirmation after checkout.
- Shipment / TTN notifications from the admin order screen.
- Password reset links.

The templates live in `lib/notifications/email-templates.ts`. They generate both
HTML and plain-text versions so the email remains readable in all clients.

## Providers

Email is simulated when no provider is configured. This is safe for local
development because checkout and account flows keep working without sending real
messages.

To send real email, configure one provider.

### Resend

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
FROM_NAME=Rytm
FROM_EMAIL=hello@your-domain.com
```

The `FROM_EMAIL` domain must be verified in Resend.

### SMTP

Use this for Hostinger email or another mailbox provider:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailbox@your-domain.com
SMTP_PASSWORD=
FROM_NAME=Rytm
FROM_EMAIL=mailbox@your-domain.com
```

For port `587`, use `SMTP_SECURE=false`.

## Password Reset

Password reset emails require:

```env
AUTH_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

The link points to:

```txt
/auth/reset-password
```

Reset tokens are stored hashed in the database and expire after 60 minutes.
