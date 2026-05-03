import type { ProductComboOffer } from "@/types/store";

export function getComboOfferTargetIds(offer: ProductComboOffer) {
  const ids = [offer.targetProductId, ...(offer.targetProductIds ?? [])]
    .map((id) => id.trim())
    .filter(Boolean);

  return Array.from(new Set(ids));
}

export function withComboOfferTargetIds(
  offer: ProductComboOffer,
  targetProductIds: string[],
) {
  const normalizedTargetIds = Array.from(
    new Set(targetProductIds.map((id) => id.trim()).filter(Boolean)),
  );

  return {
    ...offer,
    targetProductId: normalizedTargetIds[0] ?? "",
    targetProductIds: normalizedTargetIds,
  };
}
