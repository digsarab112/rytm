import { getCustomerSession } from "@/lib/customer/auth-storage";

export const CUSTOMER_SAVED_PRODUCTS_STORAGE_KEY =
  "rytm:customer:saved-products:v1";
export const CUSTOMER_SAVED_PRODUCTS_EVENT = "rytm:customer-saved-products";

type SavedProductsMap = Record<string, string[]>;

export function getSavedProductIdsForCurrentCustomer() {
  const session = getCustomerSession();

  if (!session) {
    return [];
  }

  return readCustomerSavedProductIds(session.customerId);
}

export function readCustomerSavedProductIds(customerId: string) {
  const savedProducts = readSavedProductsMap();

  return savedProducts[customerId] ?? [];
}

export function isProductSavedForCurrentCustomer(productId: string) {
  return getSavedProductIdsForCurrentCustomer().includes(productId);
}

export function toggleSavedProductForCurrentCustomer(productId: string) {
  const session = getCustomerSession();

  if (!session) {
    return { ok: false as const, saved: false, productIds: [] as string[] };
  }

  const savedProducts = readSavedProductsMap();
  const currentProductIds = savedProducts[session.customerId] ?? [];
  const isSaved = currentProductIds.includes(productId);
  const nextProductIds = isSaved
    ? currentProductIds.filter((item) => item !== productId)
    : [productId, ...currentProductIds];

  savedProducts[session.customerId] = nextProductIds;
  writeSavedProductsMap(savedProducts);
  notifySavedProductsChanged();

  return { ok: true as const, saved: !isSaved, productIds: nextProductIds };
}

export function removeSavedProductForCustomer(customerId: string, productId: string) {
  const savedProducts = readSavedProductsMap();
  const nextProductIds = (savedProducts[customerId] ?? []).filter(
    (item) => item !== productId,
  );

  savedProducts[customerId] = nextProductIds;
  writeSavedProductsMap(savedProducts);
  notifySavedProductsChanged();

  return nextProductIds;
}

function readSavedProductsMap(): SavedProductsMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const value = window.localStorage.getItem(CUSTOMER_SAVED_PRODUCTS_STORAGE_KEY);
    const parsed = value ? (JSON.parse(value) as SavedProductsMap) : {};

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeSavedProductsMap(savedProducts: SavedProductsMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CUSTOMER_SAVED_PRODUCTS_STORAGE_KEY,
    JSON.stringify(savedProducts),
  );
}

function notifySavedProductsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(CUSTOMER_SAVED_PRODUCTS_EVENT));
}
