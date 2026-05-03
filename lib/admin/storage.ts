export const ADMIN_PRODUCTS_STORAGE_KEY = "rytm:admin:products:v1";
export const ADMIN_SUPPLIERS_STORAGE_KEY = "rytm:admin:suppliers:v1";
export const ADMIN_REVIEWS_STORAGE_KEY = "rytm:admin:product-reviews:v1";
export const ADMIN_CATEGORIES_STORAGE_KEY = "rytm:admin:categories:v1";
export const ADMIN_ATTRIBUTES_STORAGE_KEY = "rytm:admin:attributes:v1";
export const ADMIN_COUPONS_STORAGE_KEY = "rytm:admin:coupons:v1";
export const ADMIN_SETTINGS_STORAGE_KEY = "rytm:admin:settings:v1";
export const ADMIN_HOMEPAGE_STORAGE_KEY = "rytm:admin:homepage:v1";
export const ADMIN_DELIVERY_PAYMENT_STORAGE_KEY =
  "rytm:admin:delivery-payment:v1";

export function createAdminId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
