# Rytm Launch Readiness Plan

## Final Launch Target

Rytm must be a complete launch-ready store after required API keys and environment variables are added. The remaining work should prepare production behavior without requiring code changes after credentials are configured.

Guardrails:

- Preserve the current Rytm visual style. Do not redesign the site or rebuild from scratch.
- Keep the customer-facing store complete and professional. Do not show customers text such as dev mode, local mode, future database, simulated, placeholder, not connected, coming later, or localStorage.
- Technical status may appear only in admin diagnostics, setup docs, or developer notes.
- Production business data must be database-backed. Browser localStorage is allowed only for temporary cart state and minor UI preferences.
- Provider secrets must stay server-side and must never be exposed through client components.

## Updated Phase Plan

### Phase 6.5 - Site Visual Completion

Add this phase before the database migration if visual gaps still exist.

Goal: make the storefront look visually complete without changing the design language.

Requirements:

- Fill image areas that the existing design already expects: product images, product galleries, category images, homepage hero image, promo/banner images, newsletter/brand visual, section visuals, catalog/category header visuals, and any other empty image slots.
- Use safe assets only: existing local SVG placeholders, generated soft SVG or illustration assets, safe local assets, or clearly royalty-free image URLs.
- Do not use random copyrighted brand images and do not copy images from MAKEUP or other ecommerce sites.
- Match the Rytm identity: cosmetics, skincare, wellness, soft, clean, warm, and professional.
- Do not overload pages with images and do not redesign sections just to add images.
- Make every visual admin-editable later through the admin panel. Seed/default visuals should be replaceable.

Verification:

- Product cards, product details, catalog/category pages, homepage modules, banners, newsletter, and section visuals all render polished images or the existing elegant fallback.
- No customer-facing image area looks broken or unfinished.

### Phase 7 - Image Management And Uploads

Goal: make admin image control easy while keeping URL mode as a safe fallback.

Admin requirements:

- Device upload/select from computer is the primary flow.
- Image URL fields remain available as an advanced/manual option.
- Show an immediate preview after selecting or entering an image.
- Allow removing images.
- Allow reordering product images.
- Treat the first product image as the main image for cards, cart previews, and the product gallery.
- Use the existing elegant placeholder when no image exists.

Managed image targets:

- Product images and galleries.
- Category and subcategory images.
- Homepage hero visual.
- Promo visual.
- Newsletter visual.
- Section visuals.
- Site and brand visuals.
- Catalog/category header visuals.

Storage behavior:

- Local/pre-launch: if no provider is configured, URL mode and safe local previews continue to work and the app must not crash.
- Production: if `IMAGE_STORAGE_PROVIDER` and provider credentials are configured, selected images upload through a server-side route/action and the returned URL is saved in the database.
- Supported providers: Cloudinary, UploadThing, Supabase Storage, and URL mode fallback.
- No image provider credentials are exposed to client components.

### Phase 8 - Database-Backed Store Data

Goal: replace temporary browser-backed business data with PostgreSQL-backed production data.

Database-backed launch entities:

- Products.
- Product images.
- Categories and subcategories.
- Suppliers and supplier shipping data.
- Customers.
- Customer profiles.
- Orders.
- Order items.
- Shipments and TTN records.
- Reviews, questions, and admin replies.
- Coupons.
- Site settings.
- Homepage settings.
- Menu, footer, and category settings.
- Product attributes.

Rules:

- Orders, customers, products, settings, reviews, questions, coupons, suppliers, shipments, and homepage configuration must not depend on localStorage in production.
- Cart state may stay local before checkout, then order creation must persist to the database.
- Admin changes must persist to the database after this phase.

### Phase 9 - Customer Profile Persistence

Goal: returning customers should not re-enter saved delivery/contact details.

Profile fields:

- Name.
- Email.
- Phone.
- City.
- Delivery method.
- Nova Poshta city/warehouse/branch when used.
- Address when applicable.
- Comment when applicable.

Checkout behavior:

- If the customer is logged in, checkout fields are prefilled from the database-backed customer profile.
- The customer can edit any field during checkout.
- After a successful order, the profile updates with the latest contact and delivery data when appropriate.
- The next checkout shows the saved profile data again.
- Customer account pages allow editing profile, contact, and delivery data.

### Phase 10 - Provider-Ready Integrations

Goal: credentials activate integrations without code changes.

Delivery and Nova Poshta:

- Manual TTN remains the default dropshipping fulfillment flow.
- Nova Poshta city and warehouse/branch selection works when the API key is configured.
- Missing Nova Poshta credentials must not block checkout; manual/default delivery remains available.
- Supplier shipping data must stay supplier-specific and must not depend on one global sender.

Payments:

- Payment architecture must be adapter-based and must not hardcode the app to one provider.
- Support LiqPay, manual/cash/payment on delivery when enabled, and a future provider adapter.
- If LiqPay keys are configured, LiqPay checkout and callback handling work.
- If keys are missing, checkout stays in safe pending/manual mode.
- Payment provider selection comes from configuration, environment variables, or admin settings where appropriate.
- Payment status is stored in the database.
- Webhook/callback routes update order payment status when the provider is configured.

Email, SMS, and Viber:

- Missing credentials keep notifications simulated/logged in admin only.
- Configured credentials send through the selected provider.
- Provider secrets stay server-side.
- Notification templates should be configurable or admin-ready where possible.

Images:

- Configured image provider credentials enable upload from device.
- Missing image provider credentials keep URL mode working.

Google login:

- Configured Google credentials enable Google login.
- Missing Google credentials keep admin password login available.

### Phase 11 - Launch Copy, Diagnostics, And Verification

Goal: verify that the public site behaves like a finished store and technical readiness is visible only to admins/developers.

Customer-facing verification:

- No customer-facing page shows dev/local/future/simulated/not connected/coming later/localStorage wording.
- Checkout, account, catalog, product details, cart, order success, reviews/questions, and public settings-driven content read as complete production features.
- Visuals render with polished Rytm-safe assets or the intended elegant fallback.

Admin/developer verification:

- Admin diagnostics may show missing provider credentials and simulated/logged notification state.
- Setup docs list required external provider steps.
- `npm run lint` passes.
- `npm run build` passes.

Env-only launch verification:

- Add `DATABASE_URL`, run migrations/seeding, and business data persists without code changes.
- Add `IMAGE_STORAGE_PROVIDER` plus provider credentials and admin device uploads save provider URLs without code changes.
- Add Nova Poshta API credentials and checkout city/branch selection works without code changes.
- Add LiqPay keys and callback/result URLs and online payment status updates work without code changes.
- Add notification provider credentials and selected email/SMS/Viber sending works without code changes.
- Add Google OAuth credentials and Google login works without code changes while password login remains available.

## Manual Setup Outside Code

The remaining launch work may require external accounts and configuration, but not code edits after the phases above are complete:

- Production PostgreSQL database, for example Supabase, Neon, or VPS PostgreSQL.
- Cloudinary, UploadThing, or Supabase Storage account/bucket for production image uploads.
- Nova Poshta API key and operational delivery account data if API-based branch selection is enabled.
- LiqPay merchant credentials and production callback/result URLs.
- Email provider or SMTP account.
- SMS/Viber provider account if real customer notifications are required.
- Google OAuth app and allowed redirect URI if Google login is enabled.
- Domain, HTTPS, hosting environment variables, and migration/deploy commands.
