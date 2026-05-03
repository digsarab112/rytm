import { searchDeliveryWarehouses } from "@/lib/integrations/delivery-locations";
import type { DeliveryMethod } from "@/types/cart";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = normalizeProvider(url.searchParams.get("provider"));
  const cityRef = url.searchParams.get("cityRef") ?? "";
  const query = url.searchParams.get("q") ?? "";
  const items = await searchDeliveryWarehouses({ provider, cityRef, query });

  return Response.json({ items });
}

function normalizeProvider(value: string | null): DeliveryMethod {
  return value === "ukrposhta" ? "ukrposhta" : "nova_poshta";
}
