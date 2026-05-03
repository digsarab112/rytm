export type NovaPoshtaSender = {
  city?: string;
  warehouse?: string;
  name?: string;
  phone?: string;
};

export type DeliveryCitySuggestion = {
  ref: string;
  deliveryCityRef?: string;
  label: string;
  city: string;
  region?: string;
  area?: string;
};

export type DeliveryWarehouseSuggestion = {
  ref: string;
  label: string;
  number?: string;
  address?: string;
};

const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

export function getGlobalNovaPoshtaConfig() {
  return {
    apiKey: process.env.NOVA_POSHTA_API_KEY,
    sender: {
      city: process.env.NOVA_POSHTA_SENDER_CITY,
      warehouse: process.env.NOVA_POSHTA_SENDER_WAREHOUSE,
      name: process.env.NOVA_POSHTA_SENDER_NAME,
      phone: process.env.NOVA_POSHTA_SENDER_PHONE,
    } satisfies NovaPoshtaSender,
    isConfigured: Boolean(process.env.NOVA_POSHTA_API_KEY),
  };
}

export async function searchNovaPoshtaCities(query: string) {
  const normalizedQuery = query.trim();
  const { apiKey, isConfigured } = getGlobalNovaPoshtaConfig();

  if (!isConfigured || normalizedQuery.length < 2) {
    return [] as DeliveryCitySuggestion[];
  }

  const response = await callNovaPoshtaApi<{
    Addresses?: Array<{
      Ref?: string;
      DeliveryCity?: string;
      Present?: string;
      MainDescription?: string;
      Area?: string;
      Region?: string;
    }>;
  }>({
    apiKey,
    modelName: "AddressGeneral",
    calledMethod: "searchSettlements",
    methodProperties: {
      CityName: normalizedQuery,
      Limit: "20",
      Page: "1",
    },
  });

  return response
    .flatMap((item) => item.Addresses ?? [])
    .map((city) => ({
      ref: city.Ref ?? city.DeliveryCity ?? city.Present ?? "",
      deliveryCityRef: city.DeliveryCity,
      label:
        city.Present ||
        [city.MainDescription, city.Region, city.Area].filter(Boolean).join(", "),
      city: city.MainDescription ?? city.Present ?? "",
      region: city.Region,
      area: city.Area,
    }))
    .filter((city) => city.ref && city.label);
}

export async function searchNovaPoshtaWarehouses(
  cityRef: string,
  query = "",
) {
  const { apiKey, isConfigured } = getGlobalNovaPoshtaConfig();

  if (!isConfigured || !cityRef) {
    return [] as DeliveryWarehouseSuggestion[];
  }

  const response = await callNovaPoshtaApi<{
    Ref?: string;
    Number?: string;
    Description?: string;
    ShortAddress?: string;
  }>({
    apiKey,
    modelName: "AddressGeneral",
    calledMethod: "getWarehouses",
    methodProperties: {
      CityRef: cityRef,
      FindByString: query.trim(),
      Limit: "80",
      Page: "1",
    },
  });

  return response
    .map((warehouse) => ({
      ref: warehouse.Ref ?? warehouse.Description ?? "",
      label: warehouse.Description ?? warehouse.ShortAddress ?? "",
      number: warehouse.Number,
      address: warehouse.ShortAddress,
    }))
    .filter((warehouse) => warehouse.ref && warehouse.label);
}

export async function createNovaPoshtaTtn() {
  return {
    simulated: true,
    ttnNumber: "",
    note: "TTN creation is intentionally manual for launch. Suppliers may create TTNs directly.",
  };
}

export async function trackNovaPoshtaShipment(ttnNumber: string) {
  return {
    simulated: true,
    ttnNumber,
    status: "unknown",
    note: "Tracking placeholder. No real Nova Poshta API call is made without credentials and implementation.",
  };
}

export async function cancelNovaPoshtaTtn(ttnNumber: string) {
  return {
    simulated: true,
    ttnNumber,
    cancelled: false,
    note: "Cancel TTN placeholder for future Nova Poshta API integration.",
  };
}

async function callNovaPoshtaApi<T>(payload: {
  apiKey: string | undefined;
  modelName: string;
  calledMethod: string;
  methodProperties: Record<string, string>;
}) {
  try {
    const response = await fetch(NOVA_POSHTA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as T[];
    }

    const json = (await response.json()) as {
      success?: boolean;
      data?: T[];
    };

    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [] as T[];
  }
}
