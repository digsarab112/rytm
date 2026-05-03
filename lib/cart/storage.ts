export const CART_STORAGE_KEY = "rytm:cart:v1";
export const ORDERS_STORAGE_KEY = "rytm:orders:v1";

export function createMockOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `RYTM-${timestamp}-${suffix}`;
}
