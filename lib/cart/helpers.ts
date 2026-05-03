import {
  getVariantDisplayPrice,
  getVariantName,
  getVariantSalePrice,
  getProductDisplayPrice,
  getProductName,
  getProductSalePrice,
} from "@/lib/catalog/helpers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import type { Locale } from "@/lib/i18n/config";
import type { DeliveryPaymentSettings } from "@/types/admin";
import type { ProductPreview } from "@/types/store";
import type { CartItem, CartLine } from "@/types/cart";

export function getCartLines(
  items: CartItem[],
  products: ProductPreview[],
  locale: Locale,
): CartLine[] {
  const cartProductIds = new Set(items.map((item) => item.productId));

  return items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product) {
      return [];
    }

    const variant = (product.variants ?? []).find(
      (candidate) => candidate.id === item.variantId && candidate.isActive,
    );
    const availableStock = variant ? variant.stock : product.stock;
    const quantity = Math.min(item.quantity, availableStock);
    const salePrice = variant
      ? getVariantSalePrice(variant)
      : getProductSalePrice(product);
    const basePrice = variant
      ? getVariantDisplayPrice(variant)
      : getProductDisplayPrice(product);
    const comboDiscountPercent =
      item.comboOfferId && hasCompleteComboGroup(item, cartProductIds)
        ? Math.max(1, Math.min(80, item.comboDiscountPercent ?? 0))
        : 0;
    const comboDiscountAmount =
      comboDiscountPercent > 0
        ? Math.round(basePrice * (comboDiscountPercent / 100))
        : 0;
    const price = Math.max(0, basePrice - comboDiscountAmount);
    const displayedSalePrice = comboDiscountPercent > 0 ? price : salePrice;

    if (quantity <= 0) {
      return [];
    }

    return [{
      productId: item.productId,
      variantId: variant?.id,
      quantity,
        name: getProductName(product, locale),
        slug: product.slug,
        brand: product.brand,
        sku: variant?.sku || product.sku,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        price: variant?.price ?? product.price,
        salePrice: displayedSalePrice,
        stock: availableStock,
        variantLabel: variant ? getVariantName(variant, locale) : undefined,
        variantSku: variant?.sku,
        variantImageUrl: variant?.image,
        comboOfferId: item.comboOfferId,
        comboSourceProductId: item.comboSourceProductId,
        comboProductIds: item.comboProductIds,
        comboDiscountPercent: comboDiscountPercent || undefined,
        comboDiscountAmount: comboDiscountAmount || undefined,
      imageUrl: variant?.image || getPrimaryProductImage(product),
      tone: product.tone,
      lineTotal: price * quantity,
    }];
  });
}

function hasCompleteComboGroup(item: CartItem, cartProductIds: Set<string>) {
  if (!item.comboOfferId) {
    return false;
  }

  const comboProductIds = Array.isArray(item.comboProductIds)
    ? item.comboProductIds.map((id) => id.trim()).filter(Boolean)
    : [];

  if (comboProductIds.length > 0) {
    return comboProductIds.every((id) => cartProductIds.has(id));
  }

  return Boolean(
    item.comboSourceProductId && cartProductIds.has(item.comboSourceProductId),
  );
}

export function getCartSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.lineTotal, 0);
}

export function getDeliveryPrice(
  subtotal: number,
  settings?: Pick<
    DeliveryPaymentSettings,
    "deliveryPrice" | "freeDeliveryThreshold"
  >,
) {
  const deliveryPrice = settings?.deliveryPrice ?? 80;
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 1500;

  if (
    subtotal <= 0 ||
    (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold)
  ) {
    return 0;
  }

  return Math.max(0, deliveryPrice);
}
