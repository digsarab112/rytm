import "server-only";

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

import {
  ADMIN_ATTRIBUTES_STORAGE_KEY,
  ADMIN_CATEGORIES_STORAGE_KEY,
  ADMIN_COUPONS_STORAGE_KEY,
  ADMIN_DELIVERY_PAYMENT_STORAGE_KEY,
  ADMIN_HOMEPAGE_STORAGE_KEY,
  ADMIN_PRODUCTS_STORAGE_KEY,
  ADMIN_REVIEWS_STORAGE_KEY,
  ADMIN_SETTINGS_STORAGE_KEY,
  ADMIN_SUPPLIERS_STORAGE_KEY,
} from "@/lib/admin/storage";
import { ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import { CUSTOMER_ACCOUNTS_STORAGE_KEY } from "@/lib/customer/storage";
import type { StorefrontConfigOverrides } from "@/types/platform";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "storefront-overrides.json");

const storageKeyToOverrideKey = {
  [ADMIN_SETTINGS_STORAGE_KEY]: "settings",
  [ADMIN_CATEGORIES_STORAGE_KEY]: "categories",
  [ADMIN_PRODUCTS_STORAGE_KEY]: "products",
  [ADMIN_SUPPLIERS_STORAGE_KEY]: "suppliers",
  [ADMIN_REVIEWS_STORAGE_KEY]: "productReviews",
  [ADMIN_ATTRIBUTES_STORAGE_KEY]: "attributeDefinitions",
  [ADMIN_HOMEPAGE_STORAGE_KEY]: "homepageSections",
  [ADMIN_DELIVERY_PAYMENT_STORAGE_KEY]: "deliveryPayment",
  [ADMIN_COUPONS_STORAGE_KEY]: "coupons",
  [ORDERS_STORAGE_KEY]: "orders",
  [CUSTOMER_ACCOUNTS_STORAGE_KEY]: "customers",
} as const satisfies Record<string, keyof StorefrontConfigOverrides>;

type OverrideStorageKey = keyof typeof storageKeyToOverrideKey;

export function isStorefrontOverrideStorageKey(
  key: string,
): key is OverrideStorageKey {
  return key in storageKeyToOverrideKey;
}

export async function readStorefrontConfigOverrides(): Promise<StorefrontConfigOverrides> {
  try {
    const contents = await readFile(STORE_PATH, "utf8");
    return normalizeOverrides(JSON.parse(stripByteOrderMark(contents)));
  } catch {
    return {};
  }
}

export async function saveStorefrontOverrideValue(
  storageKey: string,
  value: unknown,
) {
  if (!isStorefrontOverrideStorageKey(storageKey)) {
    return false;
  }

  const overrideKey = storageKeyToOverrideKey[storageKey];
  const normalizedValue = normalizeOverrideValue(overrideKey, value);

  if (!normalizedValue) {
    return false;
  }

  const overrides = await readStorefrontConfigOverrides();
  const nextOverrides = {
    ...overrides,
    [overrideKey]: normalizedValue,
  };

  await mkdir(STORE_DIR, { recursive: true });
  const temporaryPath = `${STORE_PATH}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(nextOverrides, null, 2)}\n`,
    "utf8",
  );
  await rename(temporaryPath, STORE_PATH);

  return true;
}

function normalizeOverrides(value: unknown): StorefrontConfigOverrides {
  if (!isRecord(value)) {
    return {};
  }

  const overrides: StorefrontConfigOverrides = {};

  for (const overrideKey of Object.values(storageKeyToOverrideKey)) {
    const normalizedValue = normalizeOverrideValue(
      overrideKey,
      value[overrideKey],
    );

    if (normalizedValue) {
      Object.assign(overrides, { [overrideKey]: normalizedValue });
    }
  }

  return overrides;
}

function normalizeOverrideValue(
  overrideKey: keyof StorefrontConfigOverrides,
  value: unknown,
) {
  switch (overrideKey) {
    case "settings":
    case "deliveryPayment":
      return isRecord(value) ? value : undefined;
    case "categories":
    case "products":
    case "suppliers":
    case "productReviews":
    case "attributeDefinitions":
    case "homepageSections":
    case "coupons":
    case "orders":
    case "customers":
      return Array.isArray(value) ? value : undefined;
    default:
      return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stripByteOrderMark(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
