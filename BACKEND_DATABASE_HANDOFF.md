# Backend Database Handoff

This project is ready for PostgreSQL-backed storefront data.

Give the backend developer these files:

- `DATABASE_SCHEMA.sql` - full PostgreSQL DDL generated from the Prisma schema.
- `prisma/schema.prisma` - source schema with model names, fields, relations, enums, and indexes.
- `prisma/seed.ts` - starter data shape for categories, products, settings, visuals, and reviews.

## Core Tables

- `products`, `product_images`, `product_variants`, `product_combo_offers`, `product_attribute_*`
- `categories`, `category_images`
- `suppliers`
- `customers`, `customer_profiles`, `customer_saved_products`
- `newsletter_subscriptions`
- `orders`, `order_items`, `shipments`
- `product_feedback`, `product_feedback_replies`
- `coupons`
- `site_settings`, `site_visuals`, `hero_media_slides`
- `homepage_sections`, `storefront_menu_items`, `footer_navigation_*`
- `delivery_payment_settings`
- `payment_transactions`, `notification_logs`

## Important Relations

- Product belongs to category and optionally supplier.
- Product has many images, variants, combo offers, attribute values, feedback entries, and order items.
- Product variants support flexible storefront choices through `optionType`,
  `optionNameUk`, `optionNameRu`, `labelUk`, `labelRu`, optional `colorHex`,
  optional image, and separate SKU/price/stock. Use `optionType = 'color'` for
  color choices, `size` for ml/volume, `scent` for fragrance, `style` for a
  product type, or `other` for custom choices.
- Product combo offers live in `product_combo_offers`: a source product points to
  another product with a discount percent and localized title/description. The
  storefront can show manual offers first and fall back to smart related products
  if no manual offer exists.
- Product SEO content is stored on `products.seo` as JSONB. It includes localized
  SEO title, meta description, focus keyword, long-tail keywords, product FAQ,
  benefits, suitable-for copy, internal links, structured data toggle, and optional
  search ranking hints.
- Category can have a parent category and many child subcategories.
- Customer has one profile, many orders, feedback entries, feedback replies, and saved products.
- Saved products link customers and products through `customer_saved_products`.
- Newsletter form submissions are stored in `newsletter_subscriptions`.
- Order has many order items, shipments, payment transactions, and notification logs.
- Shipment belongs to order and optionally supplier.
- Feedback belongs to product and optionally customer.
- Feedback replies belong to a feedback entry and optionally a customer.
- New feedback and customer replies are public immediately with `status = 'approved'`.
  Admin hiding should set `status = 'rejected'`; hidden feedback and replies should not
  appear publicly.

## Admin Customer Analytics

The admin customer analytics page is derived from existing tables:

- Registered users come from `customers`.
- Contact/delivery details come from `customer_profiles` and recent `orders`.
- Purchase count, repeat buyer count, total spent, average order value, and latest order
  are calculated from `orders` joined by `customerId` or customer email.
- Order history uses `orders` and `order_items`.

No extra analytics table is required for launch. A backend API can expose this as a
computed endpoint later, for example `/admin/customers/:id/insights`.

## Product SEO JSON Shape

The `products.seo` JSONB field should keep this shape:

```json
{
  "title": { "uk": "", "ru": "" },
  "metaDescription": { "uk": "", "ru": "" },
  "focusKeyword": { "uk": "", "ru": "" },
  "longTailKeywords": { "uk": "", "ru": "" },
  "features": { "uk": "", "ru": "" },
  "suitableFor": { "uk": "", "ru": "" },
  "faq": [
    {
      "id": "seo-faq-example",
      "question": { "uk": "", "ru": "" },
      "answer": { "uk": "", "ru": "" },
      "sortOrder": 10
    }
  ],
  "internalLinks": [
    {
      "id": "seo-link-example",
      "label": { "uk": "", "ru": "" },
      "href": "/uk/catalog",
      "sortOrder": 10
    }
  ],
  "schemaEnabled": true,
  "searchBoost": 0,
  "pinInSearch": false
}
```

## Auth And Environment

Admin login uses environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Google admin login is ready when these are configured:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_URL` or `NEXTAUTH_URL`

Only the email matching `ADMIN_EMAIL` can access admin through Google.

Customer Google login is ready when these are configured:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`

Customer Google login creates or links rows in `customers` using
`provider = 'google'` and `providerAccountId = Google sub`.

## Database Options

The current app can connect directly to PostgreSQL through:

- `DATABASE_URL`
- `DIRECT_URL`

If a separate custom backend API is built later, keep the same table structure from
`DATABASE_SCHEMA.sql`. The storefront can then be adapted to call that API without
changing the public design or admin workflows.
