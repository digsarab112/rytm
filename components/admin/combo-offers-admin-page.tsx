"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  Boxes,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { ProductVisual } from "@/components/home/product-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatPrice,
  getProductDisplayPrice,
  getProductName,
} from "@/lib/catalog/helpers";
import {
  getComboOfferTargetIds,
  withComboOfferTargetIds,
} from "@/lib/catalog/combo-offers";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import { isProductPublished } from "@/lib/catalog/publication";
import { ADMIN_PRODUCTS_STORAGE_KEY, createAdminId } from "@/lib/admin/storage";
import { cn } from "@/lib/utils";
import type { ProductComboOffer, ProductPreview } from "@/types/store";

type ComboOffersAdminPageProps = {
  initialProducts: ProductPreview[];
};

export function ComboOffersAdminPage({
  initialProducts,
}: ComboOffersAdminPageProps) {
  const [products, setProducts] = useLocalStorageState(
    ADMIN_PRODUCTS_STORAGE_KEY,
    initialProducts,
  );
  const [selectedProductId, setSelectedProductId] = useState(
    () => getInitialSelectedProductId(initialProducts),
  );
  const [search, setSearch] = useState("");

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) =>
        getProductName(a, "uk").localeCompare(getProductName(b, "uk")),
      ),
    [products],
  );
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    sortedProducts[0];
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sortedProducts;
    }

    return sortedProducts.filter((product) =>
      [product.nameUk, product.nameRu, product.sku, product.brand]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, sortedProducts]);
  const stats = getComboStats(products);

  function updateProductComboOffers(
    productId: string,
    comboOffers: ProductComboOffer[],
  ) {
    const now = new Date().toISOString();

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              comboOffers,
              updatedAt: now,
            }
          : product,
      ),
    );
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Merchandising"
        title="Combo offers"
        description="Create product-specific bundle discounts. These offers appear only on source product pages where you add active combos."
        action={
          selectedProduct ? (
            <Button
              type="button"
              onClick={() =>
                updateProductComboOffers(selectedProduct.id, [
                  ...getSortedOffers(selectedProduct),
                  createComboOffer(selectedProduct, products),
                ])
              }
            >
              <Plus />
              Add combo to selected product
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {stat.label}
              </p>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <stat.icon className="size-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">
              {stat.value}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AdminCard
          title="Source products"
          description="Choose the product page where the bundle should appear."
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="pl-9"
            />
          </div>
          <div className="mt-4 grid gap-2">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <SourceProductButton
                  key={product.id}
                  product={product}
                  selected={product.id === selectedProduct?.id}
                  onClick={() => setSelectedProductId(product.id)}
                />
              ))
            ) : (
              <EmptyState text="No products match this search." />
            )}
          </div>
        </AdminCard>

        {selectedProduct ? (
          <ComboOffersEditor
            product={selectedProduct}
            products={products}
            onChange={(comboOffers) =>
              updateProductComboOffers(selectedProduct.id, comboOffers)
            }
          />
        ) : (
          <EmptyState text="No products available yet." />
        )}
      </div>
    </div>
  );
}

function SourceProductButton({
  product,
  selected,
  onClick,
}: {
  product: ProductPreview;
  selected: boolean;
  onClick: () => void;
}) {
  const offers = product.comboOffers ?? [];
  const activeCount = offers.filter((offer) => offer.isActive).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-secondary"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-bold leading-5 text-foreground">
            {getProductName(product, "uk")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.sku} - {product.brand || "No brand"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-card px-2 py-1 text-xs font-bold text-primary">
          {activeCount}/{offers.length}
        </span>
      </div>
    </button>
  );
}

function ComboOffersEditor({
  product,
  products,
  onChange,
}: {
  product: ProductPreview;
  products: ProductPreview[];
  onChange: (comboOffers: ProductComboOffer[]) => void;
}) {
  const offers = getSortedOffers(product);
  const targetOptions = products
    .filter((item) => item.id !== product.id)
    .sort((a, b) => getProductName(a, "uk").localeCompare(getProductName(b, "uk")));

  function updateOffer(offerId: string, updates: Partial<ProductComboOffer>) {
    onChange(
      offers.map((offer) =>
        offer.id === offerId ? { ...offer, ...updates } : offer,
      ),
    );
  }

  function addOffer() {
    onChange([...offers, createComboOffer(product, products)]);
  }

  function removeOffer(offerId: string) {
    onChange(offers.filter((offer) => offer.id !== offerId));
  }

  return (
    <AdminCard
      title={`Combos for ${getProductName(product, "uk")}`}
      description="Choose two or more bundle products and apply the discount to the whole bundle when customers add it from this product page."
    >
      <div className="grid gap-4">
        <div className="grid gap-4 rounded-lg border border-border bg-background p-4 lg:grid-cols-[96px_1fr_auto] lg:items-center">
          <ProductVisual
            tone={product.tone}
            imageUrl={getPrimaryProductImage(product)}
            alt={getProductName(product, "uk")}
            className="aspect-square"
          />
          <div>
            <p className="font-bold text-foreground">
              {getProductName(product, "uk")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPrice(getProductDisplayPrice(product))} UAH - {product.sku}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/uk/products/${product.slug}`}>
              <Eye />
              View product
            </Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={targetOptions.length === 0}
          onClick={addOffer}
        >
          <Plus />
          Add combo
        </Button>

        {offers.length > 0 ? (
          <div className="grid gap-4">
            {offers.map((offer) => {
              const targetProducts = getComboOfferTargetIds(offer)
                .map((targetProductId) =>
                  products.find((item) => item.id === targetProductId),
                )
                .filter((item): item is ProductPreview => Boolean(item));
              const targetNames = targetProducts
                .map((targetProduct) => getProductName(targetProduct, "uk"))
                .join(" + ");
              const hasHiddenTarget = targetProducts.some(
                (targetProduct) => !isProductPublished(targetProduct),
              );

              return (
                <article
                  key={offer.id}
                  className="grid gap-4 rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-bold text-foreground">
                        {targetNames || "Target products missing"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Discount applies to the source product and every selected bundle product.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-primary">
                        -{offer.discountPercent}%
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          offer.isActive
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-card text-muted-foreground",
                        )}
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </span>
                      {hasHiddenTarget ? (
                        <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
                          Some targets hidden
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ComboTargetPicker
                      offer={offer}
                      productOptions={targetOptions}
                      onChange={(updatedOffer) =>
                        updateOffer(offer.id, updatedOffer)
                      }
                    />
                    <TextField
                      label="Discount percent"
                      type="number"
                      min="1"
                      value={offer.discountPercent}
                      onChange={(discountPercent) =>
                        updateOffer(offer.id, {
                          discountPercent: Math.max(
                            1,
                            Math.min(80, Number(discountPercent) || 10),
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Sort order"
                      type="number"
                      value={offer.sortOrder}
                      onChange={(sortOrder) =>
                        updateOffer(offer.id, {
                          sortOrder: Number(sortOrder) || 0,
                        })
                      }
                    />
                    <ToggleField
                      label="Active"
                      checked={offer.isActive}
                      onChange={(isActive) => updateOffer(offer.id, { isActive })}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="Title Ukrainian"
                      value={offer.titleUk ?? ""}
                      onChange={(titleUk) =>
                        updateOffer(offer.id, {
                          titleUk: titleUk || undefined,
                        })
                      }
                    />
                    <TextField
                      label="Title Russian"
                      value={offer.titleRu ?? ""}
                      onChange={(titleRu) =>
                        updateOffer(offer.id, {
                          titleRu: titleRu || undefined,
                        })
                      }
                    />
                    <TextAreaField
                      label="Description Ukrainian"
                      value={offer.descriptionUk ?? ""}
                      onChange={(descriptionUk) =>
                        updateOffer(offer.id, {
                          descriptionUk: descriptionUk || undefined,
                        })
                      }
                    />
                    <TextAreaField
                      label="Description Russian"
                      value={offer.descriptionRu ?? ""}
                      onChange={(descriptionRu) =>
                        updateOffer(offer.id, {
                          descriptionRu: descriptionRu || undefined,
                        })
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => removeOffer(offer.id)}
                  >
                    <Trash2 />
                    Remove combo
                  </Button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No combo offers for this product. Add one here and it will appear only on this product page." />
        )}
      </div>
    </AdminCard>
  );
}

function ComboTargetPicker({
  offer,
  productOptions,
  onChange,
}: {
  offer: ProductComboOffer;
  productOptions: ProductPreview[];
  onChange: (offer: ProductComboOffer) => void;
}) {
  const selectedIds = getComboOfferTargetIds(offer);

  function toggleProduct(productId: string) {
    const nextTargetIds = selectedIds.includes(productId)
      ? selectedIds.filter((selectedId) => selectedId !== productId)
      : [...selectedIds, productId];

    onChange(withComboOfferTargetIds(offer, nextTargetIds));
  }

  return (
    <fieldset className="grid gap-3 rounded-lg border border-border bg-card p-3 md:col-span-2 xl:col-span-4">
      <legend className="px-1 text-sm font-semibold text-foreground">
        Bundle products
      </legend>
      <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {productOptions.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
              selectedIds.includes(item.id)
                ? "border-primary bg-secondary"
                : "border-border bg-background",
            )}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => toggleProduct(item.id)}
              className="mt-1 size-4 accent-primary"
            />
            <span className="min-w-0">
              <span className="line-clamp-2 font-semibold text-foreground">
                {getProductName(item, "uk")}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {item.sku} - {formatPrice(getProductDisplayPrice(item))} UAH
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Select at least one product. The source product is included automatically.
      </p>
    </fieldset>
  );
}

function getInitialSelectedProductId(products: ProductPreview[]) {
  return (
    products.find((product) => (product.comboOffers ?? []).length > 0)?.id ??
    products[0]?.id ??
    ""
  );
}

function getSortedOffers(product: ProductPreview) {
  return [...(product.comboOffers ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

function createComboOffer(
  sourceProduct: ProductPreview,
  products: ProductPreview[],
): ProductComboOffer {
  const existingOffers = sourceProduct.comboOffers ?? [];
  const targetProduct = products.find((product) => product.id !== sourceProduct.id);
  const nextSortOrder =
    existingOffers.reduce((highest, offer) => Math.max(highest, offer.sortOrder), 0) +
    10;

  return {
    id: createAdminId("combo"),
    targetProductId: targetProduct?.id ?? "",
    targetProductIds: targetProduct ? [targetProduct.id] : [],
    discountPercent: 10,
    isActive: true,
    sortOrder: nextSortOrder,
    titleUk: "Комплект зі знижкою",
    titleRu: "Комплект со скидкой",
    descriptionUk: "",
    descriptionRu: "",
  };
}

function getComboStats(products: ProductPreview[]) {
  const comboOffers = products.flatMap((product) => product.comboOffers ?? []);
  const activeOffers = comboOffers.filter((offer) => offer.isActive);
  const productsWithOffers = products.filter(
    (product) => (product.comboOffers ?? []).length > 0,
  );

  return [
    {
      label: "Products with combos",
      value: String(productsWithOffers.length),
      icon: Boxes,
    },
    {
      label: "Active offers",
      value: String(activeOffers.length),
      icon: BadgePercent,
    },
    {
      label: "Highest discount",
      value: activeOffers.length
        ? `${Math.max(...activeOffers.map((offer) => offer.discountPercent))}%`
        : "0%",
      icon: BadgePercent,
    },
  ];
}
