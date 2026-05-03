"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin/auth";
import { saveDatabaseOverrideValue } from "@/lib/platform/storefront-database";
import { saveStorefrontOverrideValue } from "@/lib/platform/storefront-overrides-store";
import { isStorefrontOverrideStorageKey } from "@/lib/platform/storefront-overrides-store";

export async function persistAdminStorageValue(key: string, value: unknown) {
  const session = await getAdminSession();

  if (!session) {
    return { ok: false };
  }

  if (!isStorefrontOverrideStorageKey(key)) {
    return { ok: false };
  }

  const databaseOk = await saveDatabaseOverrideValue(
    keyToOverrideKey(key),
    value,
  );
  const ok = databaseOk || (await saveStorefrontOverrideValue(key, value));

  if (ok) {
    revalidatePath("/", "layout");
  }

  return { ok };
}

function keyToOverrideKey(key: Parameters<typeof saveStorefrontOverrideValue>[0]) {
  const mappings = {
    "rytm:admin:settings:v1": "settings",
    "rytm:admin:categories:v1": "categories",
    "rytm:admin:products:v1": "products",
    "rytm:admin:suppliers:v1": "suppliers",
    "rytm:admin:product-reviews:v1": "productReviews",
    "rytm:admin:attributes:v1": "attributeDefinitions",
    "rytm:admin:homepage:v1": "homepageSections",
    "rytm:admin:delivery-payment:v1": "deliveryPayment",
    "rytm:admin:coupons:v1": "coupons",
    "rytm:orders:v1": "orders",
    "rytm:customer:accounts:v1": "customers",
  } as const;

  return mappings[key as keyof typeof mappings];
}
