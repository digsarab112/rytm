import type {
  ProductPreview,
  ProductPublicationStatus,
} from "@/types/store";

export const productPublicationStatuses: ProductPublicationStatus[] = [
  "draft",
  "pending_review",
  "published",
  "archived",
];

export function getProductPublicationStatus(
  product: ProductPreview,
): ProductPublicationStatus {
  if (product.publicationStatus) {
    return product.publicationStatus;
  }

  return product.status === "draft" ? "draft" : "published";
}

export function isProductPublished(product: ProductPreview) {
  return getProductPublicationStatus(product) === "published";
}

export function isProductAvailable(product: ProductPreview) {
  return product.status === "active" && product.stock > 0;
}

export function isProductMerchandisable(product: ProductPreview) {
  return isProductPublished(product) && isProductAvailable(product);
}

export function getPublishedProducts<T extends ProductPreview>(products: T[] = []) {
  return products.filter((product) => isProductPublished(product));
}

export function getMerchandisableProducts<T extends ProductPreview>(
  products: T[] = [],
) {
  return products.filter((product) => isProductMerchandisable(product));
}
