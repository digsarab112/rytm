# Rytm

Rytm is a configurable ecommerce storefront for the Ukrainian market. Phase 1 sets up the Next.js foundation, localized public layout, brand identity, and modular homepage using temporary mock data shaped for later database/admin replacement.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/uk`; Russian content is available at `/ru`.

## Checks

```bash
npm run lint
npm run build
```

## Launch Prep Notes

- Suppliers are managed at `/admin/suppliers`; product assignment is edited in `/admin/products`.
- Product reviews are moderated at `/admin/reviews`; only approved reviews appear publicly.
- Product images are managed as ordered URL fields in `/admin/products`; the first image is used for product cards and cart previews, while the product page renders a gallery.
- Orders in `/admin/orders` now show supplier groups, manual TTN fields, delivery status, payment status, and simulated customer notification logs.
- LiqPay, Nova Poshta, SMS/Viber, email, image upload providers, and Google login are prepared through environment variables, but local development works without paid services.
- The updated launch-readiness requirements live in `LAUNCH_READINESS_PLAN.md`. The final target is a complete store that works after production API keys/environment variables are added, without additional code edits.
- See `SETUP_ENV.md`, `PAYMENT_SETUP.md`, `AUTH_SETUP.md`, and `DEPLOYMENT.md` for launch configuration.

## Product Images

- Current pre-launch mode uses image URLs. Local placeholders under `/public/placeholders` and safe remote `https://` URLs both work.
- The launch plan requires device upload/select from the admin panel, immediate previews, removal, product image reordering, URL mode as an advanced fallback, and provider-backed uploads through Cloudinary, UploadThing, or Supabase Storage.
- Production uploads should go to an external storage provider or VPS storage path, not into the Next.js project filesystem.
- Set `IMAGE_STORAGE_PROVIDER` and provider credentials when the upload route/server action is implemented; local development can stay on `url`.

## Phase 1 Notes

- Public content is URL-localized with `/uk` and `/ru`.
- Homepage sections are driven by typed mock configuration in `lib/mock/store.ts`.
- Static UI labels live in `lib/i18n/dictionaries.ts`.
- The logo and favicon are original SVG assets for the first Rytm identity.

## Phase 2 Notes

- Catalog routes are available at `/uk/catalog` and `/ru/catalog`.
- Product detail routes are available at `/uk/products/[slug]` and `/ru/products/[slug]`.
- Product and category mock data now follows database-ready fields such as `nameUk`, `nameRu`, `descriptionUk`, `descriptionRu`, `categoryId`, `stock`, `sku`, `status`, and flexible `attributes`.
- Catalog filtering is URL-driven for search, category, brand, skin type, availability, price range, and sorting.

## Phase 3 Notes

- Cart routes are available at `/uk/cart` and `/ru/cart`.
- Checkout routes are available at `/uk/checkout` and `/ru/checkout`.
- Order success routes are available at `/uk/order-success?order=...` and `/ru/order-success?order=...`.
- Cart contents persist in browser localStorage under `rytm:cart:v1`.
- Temporary mock orders persist in browser localStorage under `rytm:orders:v1`; the database-backed launch phase will replace this with database order creation.
- Cash on delivery is selectable as the main payment method, with online/card placeholders kept in the form for later integrations.

## Phase 4 Notes

- Admin login is available at `/admin/login`.
- Protected admin dashboard is available at `/admin`.
- Admin routes use an HTTP-only signed session cookie.
- Production admin access is Google-only. Configure `ADMIN_EMAIL`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_SESSION_SECRET`.
- Password admin login is disabled in production. A password fallback can be
  enabled only for temporary local troubleshooting with
  `ADMIN_PASSWORD_LOGIN_ENABLED=true`.

## Phase 5 Notes

- Admin workspaces are available for products, categories, orders, customers, coupons, site settings, homepage sections, menu settings, delivery/payment, and SEO.
- Admin changes are stored temporarily in browser localStorage until the database layer is added.
- Orders created through checkout can be reviewed and updated from `/admin/orders` in the same browser.

## Phase 6 Notes

- Public header, footer, homepage, catalog, product details, category visibility, homepage section visibility, and brand colors now read from a shared storefront configuration layer.
- Product attributes are managed from `/admin/attributes` and can be used as reusable catalog filters and product detail fields.
- The configuration shape is centralized in `types/platform.ts` and `lib/platform/storefront-config.ts` so the database-backed launch phase can replace local configuration overrides with Prisma-backed queries.

## Next Launch Phases

The detailed requirements are tracked in `LAUNCH_READINESS_PLAN.md`.

- Phase 6.5: complete existing visual slots with safe Rytm-aligned images/assets before database migration if needed.
- Phase 7: add admin image upload/select from device, previews, removal, product image reordering, URL fallback, and provider-backed uploads.
- Phase 8: move products, images, categories, suppliers, customers, orders, reviews, coupons, settings, homepage/menu/footer data, and attributes to the database.
- Phase 9: persist customer profiles, prefill checkout for logged-in customers, update saved delivery/contact data after orders, and allow account editing.
- Phase 10: finish provider-ready adapters for Nova Poshta, payments, notifications, images, and Google login so credentials activate features without code changes.
- Phase 11: verify customer-facing launch polish, admin diagnostics, provider fallbacks, `npm run lint`, and `npm run build`.
