import "server-only";

import {
  type DeliveryCitySuggestion,
  type DeliveryWarehouseSuggestion,
  searchNovaPoshtaCities,
  searchNovaPoshtaWarehouses,
} from "@/lib/integrations/nova-poshta";
import type { DeliveryMethod } from "@/types/cart";

type ExternalDeliveryResponse<T> = {
  items?: T[];
  cities?: T[];
  warehouses?: T[];
};

export async function searchDeliveryCities(
  provider: DeliveryMethod,
  query: string,
) {
  const external = await searchExternalDeliveryApi<DeliveryCitySuggestion>(
    "cities",
    { provider, q: query },
  );

  if (external.length > 0) {
    return external;
  }

  if (provider === "nova_poshta") {
    return searchNovaPoshtaCities(query);
  }

  return [] as DeliveryCitySuggestion[];
}

export async function searchDeliveryWarehouses({
  provider,
  cityRef,
  query,
}: {
  provider: DeliveryMethod;
  cityRef: string;
  query: string;
}) {
  const external = await searchExternalDeliveryApi<DeliveryWarehouseSuggestion>(
    "warehouses",
    { provider, cityRef, q: query },
  );

  if (external.length > 0) {
    return external;
  }

  if (provider === "nova_poshta") {
    return searchNovaPoshtaWarehouses(cityRef, query);
  }

  return [] as DeliveryWarehouseSuggestion[];
}

async function searchExternalDeliveryApi<T>(
  endpoint: "cities" | "warehouses",
  params: Record<string, string>,
) {
  const baseUrl = process.env.DELIVERY_API_BASE_URL?.replace(/\/$/, "");
  const token = process.env.DELIVERY_API_TOKEN;

  if (!baseUrl) {
    return [] as T[];
  }

  try {
    const url = new URL(`${baseUrl}/delivery/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as T[];
    }

    const data = (await response.json()) as ExternalDeliveryResponse<T>;
    const items = data.items ?? data.cities ?? data.warehouses ?? [];

    return Array.isArray(items) ? items : [];
  } catch {
    return [] as T[];
  }
}
