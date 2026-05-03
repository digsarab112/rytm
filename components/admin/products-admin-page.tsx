"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  EyeOff,
  FileText,
  Filter,
  Link2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  AdminActionFeedback,
  type AdminActionRunner,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  Field,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { AdminImageUploadField } from "@/components/admin/image-upload-field";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/catalog/category-tree";
import {
  formatPrice,
  getCategoryName,
  getProductDiscountPercent,
  getProductDisplayPrice,
  getProductName,
  getProductSalePrice,
  isProductDiscounted,
} from "@/lib/catalog/helpers";
import {
  getComboOfferTargetIds,
  withComboOfferTargetIds,
} from "@/lib/catalog/combo-offers";
import {
  getProductPublicationStatus,
  isProductPublished,
  productPublicationStatuses,
} from "@/lib/catalog/publication";
import {
  ADMIN_ATTRIBUTES_STORAGE_KEY,
  ADMIN_CATEGORIES_STORAGE_KEY,
  ADMIN_PRODUCTS_STORAGE_KEY,
  ADMIN_SUPPLIERS_STORAGE_KEY,
  createAdminId,
} from "@/lib/admin/storage";
import { cn } from "@/lib/utils";
import type {
  CategoryPreview,
  ProductAttributeDefinition,
  ProductAttributeValue,
  ProductComboOffer,
  ProductPreview,
  ProductSeo,
  ProductSeoFaq,
  ProductSeoInternalLink,
  ProductPublicationStatus,
  ProductStatus,
  ProductVariant,
  Supplier,
  VisualTone,
} from "@/types/store";

type ProductsAdminPageProps = {
  initialProducts: ProductPreview[];
  categories: CategoryPreview[];
  attributeDefinitions: ProductAttributeDefinition[];
  suppliers: Supplier[];
};

type ProductSortOption =
  | "name"
  | "created-desc"
  | "created-asc"
  | "updated-desc"
  | "price-asc"
  | "price-desc"
  | "stock-asc"
  | "stock-desc";

type ProductStockFilter = "all" | "in-stock" | "out-of-stock" | "low-stock";
type ProductAgeFilter = "all" | "old" | "recently-updated";
type ProductPublicationFilter =
  | "all"
  | "unpublished"
  | ProductPublicationStatus;

type ProductFilters = {
  search: string;
  supplierId: string;
  categoryId: string;
  stock: ProductStockFilter;
  publication: ProductPublicationFilter;
  age: ProductAgeFilter;
  sort: ProductSortOption;
};

const productStatuses: ProductStatus[] = ["active", "out_of_stock", "draft"];
const tones: VisualTone[] = ["rose", "sage", "cream", "linen"];
const oldProductDays = 60;
const recentUpdateDays = 14;
const recentPriceUpdateDays = 14;

const defaultFilters: ProductFilters = {
  search: "",
  supplierId: "all",
  categoryId: "all",
  stock: "all",
  publication: "all",
  age: "all",
  sort: "updated-desc",
};

const publicationLabels: Record<ProductPublicationStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  archived: "Archived",
};

const inventoryLabels: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Legacy draft",
  out_of_stock: "Out of stock",
};

const sortLabels: Record<ProductSortOption, string> = {
  name: "Name A-Z",
  "created-desc": "Newest created",
  "created-asc": "Oldest created",
  "updated-desc": "Recently updated",
  "price-asc": "Price low to high",
  "price-desc": "Price high to low",
  "stock-asc": "Stock low to high",
  "stock-desc": "Stock high to low",
};

export function ProductsAdminPage({
  initialProducts,
  categories,
  attributeDefinitions,
  suppliers,
}: ProductsAdminPageProps) {
  const [products, setProducts] = useLocalStorageState(
    ADMIN_PRODUCTS_STORAGE_KEY,
    initialProducts,
  );
  const [adminCategories] = useLocalStorageState(
    ADMIN_CATEGORIES_STORAGE_KEY,
    categories,
  );
  const [adminAttributeDefinitions] = useLocalStorageState(
    ADMIN_ATTRIBUTES_STORAGE_KEY,
    attributeDefinitions,
  );
  const [adminSuppliers] = useLocalStorageState(
    ADMIN_SUPPLIERS_STORAGE_KEY,
    suppliers,
  );
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const categoryOptions = useMemo(
    () => flattenCategoryTree(buildCategoryTree(adminCategories)),
    [adminCategories],
  );
  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, filters, adminCategories, adminSuppliers),
    [adminCategories, adminSuppliers, filters, products],
  );
  const selectedProduct =
    products.find((product) => product.id === selectedId) ??
    filteredProducts[0] ??
    products[0];

  const stats = getProductStats(products, adminCategories);

  function updateFilter<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  function updateProduct(productId: string, updates: Partial<ProductPreview>) {
    const now = new Date().toISOString();

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const currentPublicationStatus = getProductPublicationStatus(product);
        const priceChanged =
          (hasOwn(updates, "price") && updates.price !== product.price) ||
          (hasOwn(updates, "salePrice") && updates.salePrice !== product.salePrice);
        const publicationChanged =
          updates.publicationStatus !== undefined &&
          updates.publicationStatus !== currentPublicationStatus;
        const nextProduct: ProductPreview = {
          ...product,
          ...updates,
          updatedAt: now,
        };

        if (priceChanged) {
          nextProduct.priceUpdatedAt = now;
        }

        if (
          publicationChanged &&
          updates.publicationStatus === "published" &&
          !product.publishedAt
        ) {
          nextProduct.publishedAt = now;
        }

        return nextProduct;
      }),
    );
  }

  function createProduct() {
    const now = new Date().toISOString();
    const product: ProductPreview = {
      id: createAdminId("product"),
      nameUk: "New product",
      nameRu: "New product",
      slug: `new-product-${Date.now().toString(36)}`,
      shortDescriptionUk: "",
      shortDescriptionRu: "",
      descriptionUk: "",
      descriptionRu: "",
      price: 0,
      stock: 0,
      sku: `SKU-${Date.now().toString(36).toUpperCase()}`,
      brand: "",
      categoryId: "",
      images: [],
      ingredientsUk: "",
      ingredientsRu: "",
      usageUk: "",
      usageRu: "",
      warningsUk: "",
      warningsRu: "",
      status: "active",
      publicationStatus: "draft",
      popularity: 0,
      createdAt: now,
      updatedAt: now,
      tone: "cream",
      attributes: [],
      variants: [],
      comboOffers: [],
      seo: getEmptyProductSeo(),
    };

    setProducts((currentProducts) => [product, ...currentProducts]);
    setSelectedId(product.id);
    setFilters(defaultFilters);
  }

  function deleteProduct(productId: string) {
    const remainingProducts = products.filter((product) => product.id !== productId);

    setProducts(remainingProducts);
    setSelectedId(remainingProducts[0]?.id ?? "");
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Products"
        description="Search, filter, price, stock, categorize, assign suppliers, and explicitly publish products before they appear publicly."
        action={
          <Button
            type="button"
            disabled={isPending("create-product")}
            onClick={() =>
              runAction("create-product", createProduct, "Draft product created.")
            }
          >
            <Plus />
            {isPending("create-product") ? "Creating..." : "New draft product"}
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {stat.helper}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AdminCard
          title="Catalog products"
          description={`${filteredProducts.length} of ${products.length} products shown`}
        >
          <ProductFiltersPanel
            filters={filters}
            categories={categoryOptions}
            suppliers={adminSuppliers}
            onChange={updateFilter}
            onReset={() => setFilters(defaultFilters)}
          />

          <div className="mt-5 grid gap-2">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductListButton
                  key={product.id}
                  product={product}
                  categories={adminCategories}
                  selected={product.id === selectedProduct?.id}
                  onClick={() => setSelectedId(product.id)}
                />
              ))
            ) : (
              <EmptyState text="No products match the current filters." />
            )}
          </div>
        </AdminCard>

        {selectedProduct ? (
          <ProductEditor
            product={selectedProduct}
            products={products}
            categories={adminCategories}
            attributeDefinitions={adminAttributeDefinitions}
            suppliers={adminSuppliers}
            onChange={(updates) => updateProduct(selectedProduct.id, updates)}
            onDelete={() => deleteProduct(selectedProduct.id)}
            runAction={runAction}
            isPending={isPending}
          />
        ) : (
          <EmptyState text="No products yet." />
        )}
      </div>
    </div>
  );
}

function ProductFiltersPanel({
  filters,
  categories,
  suppliers,
  onChange,
  onReset,
}: {
  filters: ProductFilters;
  categories: Array<CategoryPreview & { depth: number }>;
  suppliers: Supplier[];
  onChange: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => void;
  onReset: () => void;
}) {
  const [categorySearch, setCategorySearch] = useState("");
  const activeFilters = [
    filters.search.trim() ? "Search" : undefined,
    filters.supplierId !== "all" ? "Supplier" : undefined,
    filters.categoryId !== "all" ? "Category" : undefined,
    filters.publication !== "all" ? "Publication" : undefined,
    filters.stock !== "all" ? "Stock" : undefined,
    filters.age !== "all" ? "Age" : undefined,
    filters.sort !== "updated-desc" ? "Sort" : undefined,
  ].filter(Boolean);
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedCategorySearch) {
      return true;
    }

    return getCategoryName(category, "uk")
      .toLowerCase()
      .includes(normalizedCategorySearch);
  });
  const mainCategories = filteredCategories.filter(
    (category) => category.depth === 0,
  );
  const subcategories = filteredCategories.filter(
    (category) => category.depth > 0,
  );

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Filter className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Filters</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Narrow the catalog without losing the selected product.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          {activeFilters.length || "No"} active
        </span>
      </div>
      <Field label="Search by name, SKU, or brand">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Search products"
            className="pl-9"
          />
        </div>
      </Field>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {filter}
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3">
        <SelectField
          label="Supplier"
          value={filters.supplierId}
          onChange={(supplierId) => onChange("supplierId", supplierId)}
        >
          <option value="all">All suppliers</option>
          <option value="missing">Missing supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </SelectField>
        <Field label="Category">
          <div className="grid gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Search categories"
                className="pl-9"
              />
            </div>
            <select
              value={filters.categoryId}
              onChange={(event) => onChange("categoryId", event.target.value)}
              className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All categories</option>
              <option value="missing">Missing category</option>
              {mainCategories.length > 0 ? (
                <optgroup label="Main categories">
                  {mainCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryName(category, "uk")}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {subcategories.length > 0 ? (
                <optgroup label="Subcategories">
                  {subcategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryName(category, "uk")}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </div>
        </Field>
        <SelectField
          label="Publication"
          value={filters.publication}
          onChange={(publication) =>
            onChange("publication", publication as ProductPublicationFilter)
          }
        >
          <option value="all">All publication states</option>
          <option value="unpublished">Unpublished only</option>
          {productPublicationStatuses.map((status) => (
            <option key={status} value={status}>
              {publicationLabels[status]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Stock"
          value={filters.stock}
          onChange={(stock) => onChange("stock", stock as ProductStockFilter)}
        >
          <option value="all">All stock states</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
          <option value="low-stock">Low stock</option>
        </SelectField>
        <SelectField
          label="Age"
          value={filters.age}
          onChange={(age) => onChange("age", age as ProductAgeFilter)}
        >
          <option value="all">All dates</option>
          <option value="old">Old products</option>
          <option value="recently-updated">Recently updated</option>
        </SelectField>
        <SelectField
          label="Sort"
          value={filters.sort}
          onChange={(sort) => onChange("sort", sort as ProductSortOption)}
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
      <Button type="button" variant="outline" onClick={onReset} className="w-full">
        <Filter />
        Reset filters
      </Button>
    </div>
  );
}

function ProductListButton({
  product,
  categories,
  selected,
  onClick,
}: {
  product: ProductPreview;
  categories: CategoryPreview[];
  selected: boolean;
  onClick: () => void;
}) {
  const publicationStatus = getProductPublicationStatus(product);
  const indicators = getProductIndicators(product, categories);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-secondary"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-foreground">
            {getProductName(product, "uk")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.sku} - {product.brand || "No brand"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatPrice(getProductDisplayPrice(product))} UAH
            {isProductDiscounted(product)
              ? ` - regular ${formatPrice(product.price)} UAH`
              : ""}{" "}
            - stock {product.stock}
          </p>
        </div>
        <StatusPill status={publicationStatus} />
      </div>
      {indicators.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {indicators.map((indicator) => (
            <span
              key={indicator}
              className="rounded-full bg-card px-2 py-1 text-xs font-semibold text-muted-foreground"
            >
              {indicator}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function ProductEditor({
  product,
  products,
  categories,
  attributeDefinitions,
  suppliers,
  onChange,
  onDelete,
  runAction,
  isPending,
}: {
  product: ProductPreview;
  products: ProductPreview[];
  categories: CategoryPreview[];
  attributeDefinitions: ProductAttributeDefinition[];
  suppliers: Supplier[];
  onChange: (updates: Partial<ProductPreview>) => void;
  onDelete: () => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  function updateAttribute(
    definitionId: string,
    updates: Partial<ProductAttributeValue>,
  ) {
    const currentAttribute = product.attributes.find(
      (attribute) => attribute.definitionId === definitionId,
    );
    const nextAttribute: ProductAttributeValue = {
      definitionId,
      value: currentAttribute?.value ?? "",
      ...currentAttribute,
      ...updates,
    };
    const hasValue =
      String(nextAttribute.value).trim() ||
      nextAttribute.valueUk?.trim() ||
      nextAttribute.valueRu?.trim();
    const otherAttributes = product.attributes.filter(
      (attribute) => attribute.definitionId !== definitionId,
    );

    onChange({
      attributes: hasValue ? [...otherAttributes, nextAttribute] : otherAttributes,
    });
  }

  const publicationStatus = getProductPublicationStatus(product);
  const sortedAttributeDefinitions = [...attributeDefinitions].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);
  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === product.supplierId,
  );
  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));
  const hasCategory = categories.some((category) => category.id === product.categoryId);
  const salePrice = getProductSalePrice(product);
  const displayPrice = getProductDisplayPrice(product);
  const discountPercent = getProductDiscountPercent(product);
  const hasIgnoredSalePrice =
    typeof product.salePrice === "number" && product.salePrice > 0 && !salePrice;

  return (
    <AdminCard
      title="Product editor"
      description="Manage localized content, prices, inventory, images, suppliers, and publication state."
    >
      <div className="grid gap-6">
        <EditorSection
          title="Status and workflow"
          description="Check visibility, setup warnings, and publishing actions first."
          defaultOpen
        >
        {!isProductPublished(product) ? (
          <Notice
            icon={EyeOff}
            title="Product is hidden from the public storefront"
            text="Only products with publication status Published appear in homepage sections, catalog, search, and product pages."
          />
        ) : null}
        {!product.supplierId ? (
          <Notice
            icon={AlertTriangle}
            title="Supplier is not assigned"
            text="Assign a supplier so orders can be grouped for dropshipping fulfillment and manual TTN entry."
          />
        ) : null}
        {!hasCategory ? (
          <Notice
            icon={AlertTriangle}
            title="Category is missing"
            text="Choose a valid category before publishing so the product appears in catalog navigation and filters."
          />
        ) : null}

        <div className="grid gap-4 rounded-lg border border-border bg-background p-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetaItem label="Created" value={formatAdminDate(product.createdAt)} />
          <MetaItem label="Updated" value={formatAdminDate(product.updatedAt)} />
          <MetaItem label="Published" value={formatAdminDate(product.publishedAt)} />
          <MetaItem
            label="Price updated"
            value={formatAdminDate(product.priceUpdatedAt)}
          />
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-background p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-bold text-foreground">
              Publication workflow
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              New products stay as drafts until you explicitly publish them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={
                publicationStatus === "published" ||
                isPending(`publish-${product.id}`)
              }
              onClick={() =>
                runAction(
                  `publish-${product.id}`,
                  () =>
                    onChange({
                      publicationStatus: "published",
                      status: product.status === "draft" ? "active" : product.status,
                    }),
                  "Product published.",
                )
              }
            >
              <CheckCircle2 />
              {isPending(`publish-${product.id}`) ? "Publishing..." : "Publish"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                publicationStatus === "draft" ||
                isPending(`unpublish-${product.id}`)
              }
              onClick={() =>
                runAction(
                  `unpublish-${product.id}`,
                  () => onChange({ publicationStatus: "draft" }),
                  "Product unpublished.",
                )
              }
            >
              <EyeOff />
              {isPending(`unpublish-${product.id}`) ? "Saving..." : "Unpublish"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                publicationStatus === "archived" ||
                isPending(`archive-${product.id}`)
              }
              onClick={() =>
                runAction(
                  `archive-${product.id}`,
                  () => onChange({ publicationStatus: "archived" }),
                  "Product archived.",
                )
              }
            >
              <Archive />
              {isPending(`archive-${product.id}`) ? "Archiving..." : "Archive"}
            </Button>
          </div>
        </div>
        </EditorSection>

        <EditorSection
          title="Core product data"
          description="Name, URL, category, supplier, price, stock, badge, and storefront status."
          defaultOpen
        >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Name Ukrainian"
            value={product.nameUk}
            onChange={(nameUk) => onChange({ nameUk })}
          />
          <TextField
            label="Name Russian"
            value={product.nameRu}
            onChange={(nameRu) => onChange({ nameRu })}
          />
          <TextField
            label="Slug"
            value={product.slug}
            onChange={(slug) => onChange({ slug })}
          />
          <TextField
            label="SKU"
            value={product.sku}
            onChange={(sku) => onChange({ sku })}
          />
          <TextField
            label="Brand"
            value={product.brand}
            onChange={(brand) => onChange({ brand })}
          />
          <SelectField
            label="Category"
            value={product.categoryId}
            onChange={(categoryId) => onChange({ categoryId })}
          >
            <option value="">No category selected</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {"  ".repeat(category.depth)}
                {getCategoryName(category, "uk")}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Supplier"
            value={product.supplierId ?? ""}
            onChange={(supplierId) => {
              const supplier = suppliers.find((item) => item.id === supplierId);

              onChange({
                supplierId: supplier?.id,
                supplierName: supplier?.name,
              });
            }}
          >
            <option value="">No supplier selected</option>
            {activeSuppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} - {supplier.city || "No city"}
              </option>
            ))}
          </SelectField>
          {selectedSupplier ? (
            <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground md:col-span-2">
              <p className="font-bold text-foreground">{selectedSupplier.name}</p>
              <p className="mt-2">
                {selectedSupplier.contactName || "No contact"} -{" "}
                {selectedSupplier.phone || "No phone"} -{" "}
                {selectedSupplier.email || "No email"}
              </p>
              <p className="mt-1">
                {selectedSupplier.city || "No city"} -{" "}
                {selectedSupplier.novaPoshtaWarehouse || "No warehouse"}
              </p>
            </div>
          ) : null}
          <TextField
            label="Regular price"
            type="number"
            min="0"
            value={product.price}
            onChange={(price) => onChange({ price: Number(price) || 0 })}
          />
          <TextField
            label="Sale price"
            type="number"
            min="0"
            value={product.salePrice ?? ""}
            onChange={(salePrice) =>
              onChange({ salePrice: salePrice ? Number(salePrice) : undefined })
            }
          />
          <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Price preview</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sale price is public only when it is lower than the regular price.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {salePrice ? `Sale -${discountPercent}%` : "Regular price"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(displayPrice)} UAH
              </span>
              {salePrice ? (
                <span className="pb-1 text-sm font-medium text-muted-foreground line-through">
                  {formatPrice(product.price)} UAH
                </span>
              ) : null}
            </div>
            {hasIgnoredSalePrice ? (
              <p className="mt-3 text-sm font-semibold text-primary">
                Sale price is ignored because it is not lower than the regular price.
              </p>
            ) : null}
          </div>
          <TextField
            label="Badge Ukrainian"
            value={product.badgeUk ?? ""}
            onChange={(badgeUk) => onChange({ badgeUk: badgeUk || undefined })}
          />
          <TextField
            label="Badge Russian"
            value={product.badgeRu ?? ""}
            onChange={(badgeRu) => onChange({ badgeRu: badgeRu || undefined })}
          />
          <TextField
            label="Stock"
            type="number"
            min="0"
            value={product.stock}
            onChange={(stock) => onChange({ stock: Number(stock) || 0 })}
          />
          <TextField
            label="Skin type"
            value={product.skinType ?? ""}
            onChange={(skinType) => onChange({ skinType })}
          />
          <SelectField
            label="Publication status"
            value={publicationStatus}
            onChange={(status) =>
              onChange({ publicationStatus: status as ProductPublicationStatus })
            }
          >
            {productPublicationStatuses.map((status) => (
              <option key={status} value={status}>
                {publicationLabels[status]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Inventory status"
            value={product.status}
            onChange={(status) => onChange({ status: status as ProductStatus })}
          >
            {productStatuses.map((status) => (
              <option key={status} value={status}>
                {inventoryLabels[status]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Visual tone"
            value={product.tone}
            onChange={(tone) => onChange({ tone: tone as VisualTone })}
          >
            {tones.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </SelectField>
        </div>
        </EditorSection>

        <EditorSection
          title="Product content"
          description="Localized descriptions, ingredients, usage, and warnings."
        >
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            label="Short description Ukrainian"
            value={product.shortDescriptionUk}
            onChange={(shortDescriptionUk) => onChange({ shortDescriptionUk })}
          />
          <TextAreaField
            label="Short description Russian"
            value={product.shortDescriptionRu}
            onChange={(shortDescriptionRu) => onChange({ shortDescriptionRu })}
          />
          <TextAreaField
            label="Description Ukrainian"
            value={product.descriptionUk}
            rows={6}
            onChange={(descriptionUk) => onChange({ descriptionUk })}
          />
          <TextAreaField
            label="Description Russian"
            value={product.descriptionRu}
            rows={6}
            onChange={(descriptionRu) => onChange({ descriptionRu })}
          />
          <TextAreaField
            label="Ingredients Ukrainian"
            value={product.ingredientsUk}
            onChange={(ingredientsUk) => onChange({ ingredientsUk })}
          />
          <TextAreaField
            label="Ingredients Russian"
            value={product.ingredientsRu}
            onChange={(ingredientsRu) => onChange({ ingredientsRu })}
          />
          <TextAreaField
            label="Usage Ukrainian"
            value={product.usageUk}
            onChange={(usageUk) => onChange({ usageUk })}
          />
          <TextAreaField
            label="Usage Russian"
            value={product.usageRu}
            onChange={(usageRu) => onChange({ usageRu })}
          />
          <TextAreaField
            label="Warnings Ukrainian"
            value={product.warningsUk}
            onChange={(warningsUk) => onChange({ warningsUk })}
          />
          <TextAreaField
            label="Warnings Russian"
            value={product.warningsRu}
            onChange={(warningsRu) => onChange({ warningsRu })}
          />
        </div>
        </EditorSection>

        <EditorSection
          title="Smart product SEO"
          description="Google title, meta description, keywords, FAQ, schema, and internal links."
        >
        <ProductSeoEditor
          product={product}
          onProductChange={onChange}
          onSeoChange={(seo) => onChange({ seo })}
          runAction={runAction}
          isPending={isPending}
        />
        </EditorSection>

        <EditorSection
          title="Product images"
          description="Upload, preview, order, and remove product images."
        >
        <ProductImageManager
          images={product.images ?? []}
          productName={getProductName(product, "uk")}
          tone={product.tone}
          onChange={(images) => onChange({ images })}
        />
        </EditorSection>

        <EditorSection
          title="Product variants"
          description="Add selectable sizes or options with separate price, stock, SKU, and image."
        >
        <ProductVariantsEditor
          product={product}
          onChange={(variants) => onChange({ variants })}
          runAction={runAction}
          isPending={isPending}
        />
        </EditorSection>

        <EditorSection
          title="Combo offers"
          description="Create iHerb-style bundle suggestions with a discount for the whole selected set."
        >
        <ProductComboOffersEditor
          product={product}
          products={products}
          onChange={(comboOffers) => onChange({ comboOffers })}
          runAction={runAction}
          isPending={isPending}
        />
        </EditorSection>

        <EditorSection
          title="Flexible attributes"
          description="Reusable values used by product details and storefront filters."
        >
        <section className="grid gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Flexible attributes
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Reusable attributes support filters and product details in the
              catalog.
            </p>
          </div>
          <div className="grid gap-4">
            {sortedAttributeDefinitions.map((definition) => {
              const attribute = product.attributes.find(
                (item) => item.definitionId === definition.id,
              );

              return (
                <div
                  key={definition.id}
                  className="grid gap-4 rounded-lg border border-border bg-background p-4 lg:grid-cols-3"
                >
                  <TextField
                    label={`${definition.nameUk} value`}
                    value={
                      Array.isArray(attribute?.value)
                        ? attribute.value.join(", ")
                        : String(attribute?.value ?? "")
                    }
                    onChange={(value) =>
                      updateAttribute(definition.id, { value })
                    }
                  />
                  <TextField
                    label="Ukrainian display"
                    value={attribute?.valueUk ?? ""}
                    onChange={(valueUk) =>
                      updateAttribute(definition.id, { valueUk })
                    }
                  />
                  <TextField
                    label="Russian display"
                    value={attribute?.valueRu ?? ""}
                    onChange={(valueRu) =>
                      updateAttribute(definition.id, { valueRu })
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>
        </EditorSection>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isPending(`save-product-${product.id}`)}
            onClick={() =>
              runAction(
                `save-product-${product.id}`,
                () => undefined,
                "Product changes saved.",
              )
            }
          >
            <Save />
            {isPending(`save-product-${product.id}`) ? "Saving..." : "Saved automatically"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`delete-product-${product.id}`)}
            onClick={() =>
              runAction(
                `delete-product-${product.id}`,
                onDelete,
                "Product deleted.",
              )
            }
          >
            <Trash2 />
            {isPending(`delete-product-${product.id}`) ? "Deleting..." : "Delete product"}
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}

function EditorSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className="group rounded-lg border border-border bg-background"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 marker:hidden">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground transition-transform group-open:rotate-180">
          <ChevronDown className="size-4" />
        </span>
      </summary>
      <div className="grid gap-5 border-t border-border p-4">{children}</div>
    </details>
  );
}

function StatusPill({ status }: { status: ProductPublicationStatus }) {
  const className: Record<ProductPublicationStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    pending_review: "bg-[#fff2d8] text-[#7a4b00]",
    published: "bg-secondary text-secondary-foreground",
    archived: "bg-card text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-xs font-semibold",
        className[status],
      )}
    >
      {publicationLabels[status]}
    </span>
  );
}

type ProductSeoLocalizedField =
  | "title"
  | "metaDescription"
  | "focusKeyword"
  | "longTailKeywords"
  | "features"
  | "suitableFor";

type ProductSeoLocale = "uk" | "ru";

function ProductSeoEditor({
  product,
  onProductChange,
  onSeoChange,
  runAction,
  isPending,
}: {
  product: ProductPreview;
  onProductChange: (updates: Partial<ProductPreview>) => void;
  onSeoChange: (seo: ProductSeo) => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  const seo = normalizeProductSeo(product.seo);
  const faqItems = [...seo.faq].sort((a, b) => a.sortOrder - b.sortOrder);
  const internalLinks = [...seo.internalLinks].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const seoScore = getSeoCompletionScore(product, seo);

  function updateSeo(updates: ProductSeo) {
    onSeoChange({ ...seo, ...updates });
  }

  function updateLocalizedField(
    field: ProductSeoLocalizedField,
    locale: ProductSeoLocale,
    value: string,
  ) {
    updateSeo({
      [field]: {
        ...(seo[field] ?? {}),
        [locale]: value,
      },
    });
  }

  function updateFaqItem(faqId: string, updates: Partial<ProductSeoFaq>) {
    updateSeo({
      faq: faqItems.map((item) =>
        item.id === faqId ? { ...item, ...updates } : item,
      ),
    });
  }

  function updateFaqLocalizedField(
    faqId: string,
    field: "question" | "answer",
    locale: ProductSeoLocale,
    value: string,
  ) {
    const faqItem = faqItems.find((item) => item.id === faqId);

    if (!faqItem) {
      return;
    }

    updateFaqItem(faqId, {
      [field]: {
        ...faqItem[field],
        [locale]: value,
      },
    });
  }

  function addFaqItem() {
    const sortOrder =
      faqItems.reduce((highest, item) => Math.max(highest, item.sortOrder), 0) + 10;

    updateSeo({
      faq: [
        ...faqItems,
        {
          id: createAdminId("seo-faq"),
          question: { uk: "", ru: "" },
          answer: { uk: "", ru: "" },
          sortOrder,
        },
      ],
    });
  }

  function removeFaqItem(faqId: string) {
    updateSeo({ faq: faqItems.filter((item) => item.id !== faqId) });
  }

  function updateInternalLink(
    linkId: string,
    updates: Partial<ProductSeoInternalLink>,
  ) {
    updateSeo({
      internalLinks: internalLinks.map((item) =>
        item.id === linkId ? { ...item, ...updates } : item,
      ),
    });
  }

  function updateInternalLinkLabel(
    linkId: string,
    locale: ProductSeoLocale,
    value: string,
  ) {
    const link = internalLinks.find((item) => item.id === linkId);

    if (!link) {
      return;
    }

    updateInternalLink(linkId, {
      label: {
        ...link.label,
        [locale]: value,
      },
    });
  }

  function addInternalLink() {
    const sortOrder =
      internalLinks.reduce((highest, item) => Math.max(highest, item.sortOrder), 0) +
      10;

    updateSeo({
      internalLinks: [
        ...internalLinks,
        {
          id: createAdminId("seo-link"),
          label: { uk: "", ru: "" },
          href: "",
          sortOrder,
        },
      ],
    });
  }

  function removeInternalLink(linkId: string) {
    updateSeo({
      internalLinks: internalLinks.filter((item) => item.id !== linkId),
    });
  }

  return (
    <section className="grid gap-5 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Smart product SEO
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Control the Google title, click description, product URL, search
              priority, FAQ, buyer benefits, and structured data for this product.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
          <p className="font-bold text-foreground">{seoScore}% ready</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on title, description, keyword, FAQ, and helpful product copy.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="SEO title Ukrainian"
          value={seo.title.uk ?? ""}
          onChange={(value) => updateLocalizedField("title", "uk", value)}
        />
        <TextField
          label="SEO title Russian"
          value={seo.title.ru ?? ""}
          onChange={(value) => updateLocalizedField("title", "ru", value)}
        />
        <TextAreaField
          label="Meta description Ukrainian"
          value={seo.metaDescription.uk ?? ""}
          rows={3}
          onChange={(value) =>
            updateLocalizedField("metaDescription", "uk", value)
          }
        />
        <TextAreaField
          label="Meta description Russian"
          value={seo.metaDescription.ru ?? ""}
          rows={3}
          onChange={(value) =>
            updateLocalizedField("metaDescription", "ru", value)
          }
        />
        <TextField
          label="Product URL slug"
          value={product.slug}
          onChange={(slug) => onProductChange({ slug: normalizeSlugInput(slug) })}
        />
        <TextField
          label="Focus keyword Ukrainian"
          value={seo.focusKeyword.uk ?? ""}
          onChange={(value) => updateLocalizedField("focusKeyword", "uk", value)}
        />
        <TextField
          label="Focus keyword Russian"
          value={seo.focusKeyword.ru ?? ""}
          onChange={(value) => updateLocalizedField("focusKeyword", "ru", value)}
        />
        <TextAreaField
          label="Long-tail keywords Ukrainian"
          value={seo.longTailKeywords.uk ?? ""}
          rows={4}
          onChange={(value) =>
            updateLocalizedField("longTailKeywords", "uk", value)
          }
        />
        <TextAreaField
          label="Long-tail keywords Russian"
          value={seo.longTailKeywords.ru ?? ""}
          rows={4}
          onChange={(value) =>
            updateLocalizedField("longTailKeywords", "ru", value)
          }
        />
        <TextAreaField
          label="Product benefits Ukrainian"
          value={seo.features.uk ?? ""}
          rows={4}
          onChange={(value) => updateLocalizedField("features", "uk", value)}
        />
        <TextAreaField
          label="Product benefits Russian"
          value={seo.features.ru ?? ""}
          rows={4}
          onChange={(value) => updateLocalizedField("features", "ru", value)}
        />
        <TextAreaField
          label="Who it suits Ukrainian"
          value={seo.suitableFor.uk ?? ""}
          rows={4}
          onChange={(value) => updateLocalizedField("suitableFor", "uk", value)}
        />
        <TextAreaField
          label="Who it suits Russian"
          value={seo.suitableFor.ru ?? ""}
          rows={4}
          onChange={(value) => updateLocalizedField("suitableFor", "ru", value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ToggleField
          label="Enable Product schema"
          checked={seo.schemaEnabled !== false}
          onChange={(schemaEnabled) => updateSeo({ schemaEnabled })}
        />
        <ToggleField
          label="Pin higher in search"
          checked={Boolean(seo.pinInSearch)}
          onChange={(pinInSearch) => updateSeo({ pinInSearch })}
        />
        <TextField
          label="Search boost 0-100"
          type="number"
          min="0"
          value={seo.searchBoost ?? 0}
          onChange={(value) =>
            updateSeo({ searchBoost: Math.max(0, Math.min(Number(value) || 0, 100)) })
          }
        />
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-1 size-5 text-primary" />
            <div>
              <h4 className="font-bold text-foreground">Product FAQ</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add real buyer questions that can also feed FAQ structured data.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`add-seo-faq-${product.id}`)}
            onClick={() =>
              runAction(`add-seo-faq-${product.id}`, addFaqItem, "FAQ item added.")
            }
          >
            <Plus />
            Add FAQ
          </Button>
        </div>
        {faqItems.length > 0 ? (
          <div className="grid gap-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-lg border border-border bg-background p-4"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    label="Question Ukrainian"
                    value={item.question.uk ?? ""}
                    onChange={(value) =>
                      updateFaqLocalizedField(item.id, "question", "uk", value)
                    }
                  />
                  <TextField
                    label="Question Russian"
                    value={item.question.ru ?? ""}
                    onChange={(value) =>
                      updateFaqLocalizedField(item.id, "question", "ru", value)
                    }
                  />
                  <TextAreaField
                    label="Answer Ukrainian"
                    value={item.answer.uk ?? ""}
                    rows={3}
                    onChange={(value) =>
                      updateFaqLocalizedField(item.id, "answer", "uk", value)
                    }
                  />
                  <TextAreaField
                    label="Answer Russian"
                    value={item.answer.ru ?? ""}
                    rows={3}
                    onChange={(value) =>
                      updateFaqLocalizedField(item.id, "answer", "ru", value)
                    }
                  />
                  <TextField
                    label="Sort order"
                    type="number"
                    value={item.sortOrder}
                    onChange={(sortOrder) =>
                      updateFaqItem(item.id, {
                        sortOrder: Number(sortOrder) || 0,
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  disabled={isPending(`remove-seo-faq-${item.id}`)}
                  onClick={() =>
                    runAction(
                      `remove-seo-faq-${item.id}`,
                      () => removeFaqItem(item.id),
                      "FAQ item removed.",
                    )
                  }
                >
                  <Trash2 />
                  Remove FAQ
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No product FAQ yet." />
        )}
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Link2 className="mt-1 size-5 text-primary" />
            <div>
              <h4 className="font-bold text-foreground">Internal links</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Link this product to useful categories, articles, or related store
                pages.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`add-seo-link-${product.id}`)}
            onClick={() =>
              runAction(
                `add-seo-link-${product.id}`,
                addInternalLink,
                "Internal link added.",
              )
            }
          >
            <Plus />
            Add link
          </Button>
        </div>
        {internalLinks.length > 0 ? (
          <div className="grid gap-4">
            {internalLinks.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-lg border border-border bg-background p-4"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    label="Label Ukrainian"
                    value={item.label.uk ?? ""}
                    onChange={(value) =>
                      updateInternalLinkLabel(item.id, "uk", value)
                    }
                  />
                  <TextField
                    label="Label Russian"
                    value={item.label.ru ?? ""}
                    onChange={(value) =>
                      updateInternalLinkLabel(item.id, "ru", value)
                    }
                  />
                  <TextField
                    label="Internal URL"
                    value={item.href}
                    onChange={(href) => updateInternalLink(item.id, { href })}
                  />
                  <TextField
                    label="Sort order"
                    type="number"
                    value={item.sortOrder}
                    onChange={(sortOrder) =>
                      updateInternalLink(item.id, {
                        sortOrder: Number(sortOrder) || 0,
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  disabled={isPending(`remove-seo-link-${item.id}`)}
                  onClick={() =>
                    runAction(
                      `remove-seo-link-${item.id}`,
                      () => removeInternalLink(item.id),
                      "Internal link removed.",
                    )
                  }
                >
                  <Trash2 />
                  Remove link
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No internal links yet." />
        )}
      </div>
    </section>
  );
}

function ProductVariantsEditor({
  product,
  onChange,
  runAction,
  isPending,
}: {
  product: ProductPreview;
  onChange: (variants: ProductVariant[]) => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  const variants = [...(product.variants ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  function updateVariant(variantId: string, updates: Partial<ProductVariant>) {
    onChange(
      variants.map((variant) => {
        if (variant.id !== variantId) {
          return updates.isDefault ? { ...variant, isDefault: false } : variant;
        }

        return { ...variant, ...updates };
      }),
    );
  }

  function addVariant() {
    const nextSortOrder =
      variants.reduce((highest, variant) => Math.max(highest, variant.sortOrder), 0) +
      10;
    const isFirstVariant = variants.length === 0;

    onChange([
      ...variants,
      {
        id: createAdminId("variant"),
        labelUk: "50 мл",
        labelRu: "50 мл",
        sku: product.sku ? `${product.sku}-${variants.length + 1}` : "",
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        image: product.images?.[0],
        isDefault: isFirstVariant,
        isActive: true,
        sortOrder: nextSortOrder,
      },
    ]);
  }

  function removeVariant(variantId: string) {
    const nextVariants = variants.filter((variant) => variant.id !== variantId);

    onChange(
      nextVariants.some((variant) => variant.isDefault) || nextVariants.length === 0
        ? nextVariants
        : nextVariants.map((variant, index) => ({
            ...variant,
            isDefault: index === 0,
          })),
    );
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Product variants</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add sizes or options such as 30 ml, 50 ml, or 100 ml with their own
            SKU, price, stock, and optional image.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isPending(`add-variant-${product.id}`)}
          onClick={() =>
            runAction(
              `add-variant-${product.id}`,
              addVariant,
              "Variant added.",
            )
          }
        >
          <Plus />
          Add variant
        </Button>
      </div>
      {variants.length > 0 ? (
        <div className="grid gap-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="grid gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  label="Option type"
                  value={variant.optionType ?? "size"}
                  onChange={(optionType) =>
                    updateVariant(variant.id, {
                      optionType: optionType as ProductVariant["optionType"],
                    })
                  }
                >
                  <option value="size">Size / ml</option>
                  <option value="color">Color</option>
                  <option value="scent">Scent</option>
                  <option value="style">Type / style</option>
                  <option value="other">Other</option>
                </SelectField>
                <TextField
                  label="Option name Ukrainian"
                  value={variant.optionNameUk ?? ""}
                  onChange={(optionNameUk) =>
                    updateVariant(variant.id, {
                      optionNameUk: optionNameUk || undefined,
                    })
                  }
                />
                <TextField
                  label="Option name Russian"
                  value={variant.optionNameRu ?? ""}
                  onChange={(optionNameRu) =>
                    updateVariant(variant.id, {
                      optionNameRu: optionNameRu || undefined,
                    })
                  }
                />
                <TextField
                  label="Color hex"
                  type="color"
                  value={variant.colorHex ?? "#ffffff"}
                  onChange={(colorHex) =>
                    updateVariant(variant.id, {
                      colorHex:
                        (variant.optionType ?? "size") === "color"
                          ? colorHex
                          : undefined,
                    })
                  }
                />
                <TextField
                  label="Label Ukrainian"
                  value={variant.labelUk}
                  onChange={(labelUk) => updateVariant(variant.id, { labelUk })}
                />
                <TextField
                  label="Label Russian"
                  value={variant.labelRu}
                  onChange={(labelRu) => updateVariant(variant.id, { labelRu })}
                />
                <TextField
                  label="Variant SKU"
                  value={variant.sku ?? ""}
                  onChange={(sku) => updateVariant(variant.id, { sku })}
                />
                <TextField
                  label="Sort order"
                  type="number"
                  value={variant.sortOrder}
                  onChange={(sortOrder) =>
                    updateVariant(variant.id, {
                      sortOrder: Number(sortOrder) || 0,
                    })
                  }
                />
                <TextField
                  label="Regular price"
                  type="number"
                  min="0"
                  value={variant.price}
                  onChange={(price) =>
                    updateVariant(variant.id, { price: Number(price) || 0 })
                  }
                />
                <TextField
                  label="Sale price"
                  type="number"
                  min="0"
                  value={variant.salePrice ?? ""}
                  onChange={(salePrice) =>
                    updateVariant(variant.id, {
                      salePrice: salePrice ? Number(salePrice) : undefined,
                    })
                  }
                />
                <TextField
                  label="Stock"
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(stock) =>
                    updateVariant(variant.id, { stock: Number(stock) || 0 })
                  }
                />
                <div className="grid gap-3">
                  <ToggleField
                    label="Active"
                    checked={variant.isActive}
                    onChange={(isActive) =>
                      updateVariant(variant.id, { isActive })
                    }
                  />
                  <ToggleField
                    label="Default"
                    checked={variant.isDefault}
                    onChange={(isDefault) =>
                      updateVariant(variant.id, { isDefault })
                    }
                  />
                </div>
              </div>
              <AdminImageUploadField
                label="Variant image"
                value={variant.image ?? ""}
                purpose="product"
                tone={product.tone}
                previewClassName="aspect-[4/3]"
                onChange={(image) =>
                  updateVariant(variant.id, { image: image || undefined })
                }
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPending(`remove-variant-${variant.id}`)}
                onClick={() =>
                  runAction(
                    `remove-variant-${variant.id}`,
                    () => removeVariant(variant.id),
                    "Variant removed.",
                  )
                }
              >
                <Trash2 />
                Remove variant
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No variants yet. Add variants only when this product has selectable sizes or options." />
      )}
    </section>
  );
}

function ProductComboOffersEditor({
  product,
  products,
  onChange,
  runAction,
  isPending,
}: {
  product: ProductPreview;
  products: ProductPreview[];
  onChange: (comboOffers: ProductComboOffer[]) => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  const offers = [...(product.comboOffers ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const productOptions = products
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
    const targetProduct = productOptions[0];
    const nextSortOrder =
      offers.reduce((highest, offer) => Math.max(highest, offer.sortOrder), 0) +
      10;

    if (!targetProduct) {
      return;
    }

    onChange([
      ...offers,
      {
        id: createAdminId("combo"),
        targetProductId: targetProduct.id,
        targetProductIds: [targetProduct.id],
        discountPercent: 10,
        isActive: true,
        sortOrder: nextSortOrder,
        titleUk: "Комплект зі знижкою",
        titleRu: "Комплект со скидкой",
        descriptionUk: "",
        descriptionRu: "",
      },
    ]);
  }

  function removeOffer(offerId: string) {
    onChange(offers.filter((offer) => offer.id !== offerId));
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Combo offers</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick one or more bundle products and discount the whole set when
            customers add the bundle from this product page. Active offers show
            here and in the dedicated Combo offers page.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={
            productOptions.length === 0 || isPending(`add-combo-${product.id}`)
          }
          onClick={() =>
            runAction(
              `add-combo-${product.id}`,
              addOffer,
              "Combo offer added.",
            )
          }
        >
          <Plus />
          Add combo
        </Button>
      </div>
      {offers.length > 0 ? (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="grid gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ProductComboTargetPicker
                  offer={offer}
                  productOptions={productOptions}
                  onChange={(updatedOffer) => updateOffer(offer.id, updatedOffer)}
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
                    updateOffer(offer.id, { titleUk: titleUk || undefined })
                  }
                />
                <TextField
                  label="Title Russian"
                  value={offer.titleRu ?? ""}
                  onChange={(titleRu) =>
                    updateOffer(offer.id, { titleRu: titleRu || undefined })
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
                disabled={isPending(`remove-combo-${offer.id}`)}
                onClick={() =>
                  runAction(
                    `remove-combo-${offer.id}`,
                    () => removeOffer(offer.id),
                    "Combo offer removed.",
                  )
                }
              >
                <Trash2 />
                Remove combo
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No combo offers yet. This product page will not show a bundle block until you add an active offer." />
      )}
    </section>
  );
}

function ProductComboTargetPicker({
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
    <fieldset className="grid gap-3 rounded-lg border border-border bg-background p-3 md:col-span-2 xl:col-span-4">
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
                : "border-border bg-card",
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
        The current product is included automatically. Select at least one more
        product for the bundle.
      </p>
    </fieldset>
  );
}

function Notice({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof AlertTriangle;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-background p-4 text-sm text-primary">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 leading-6">{text}</p>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function getProductStats(
  products: ProductPreview[],
  categories: CategoryPreview[],
) {
  const unpublishedCount = products.filter(
    (product) => !isProductPublished(product),
  ).length;
  const missingSupplierCount = products.filter(
    (product) => !product.supplierId,
  ).length;
  const missingCategoryCount = products.filter(
    (product) =>
      !product.categoryId ||
      !categories.some((category) => category.id === product.categoryId),
  ).length;

  return [
    {
      label: "Published",
      value: String(products.filter(isProductPublished).length),
      helper: "Visible publicly",
    },
    {
      label: "Unpublished",
      value: String(unpublishedCount),
      helper: "Draft, review, or archived",
    },
    {
      label: "Out of stock",
      value: String(products.filter(isOutOfStock).length),
      helper: "Needs inventory check",
    },
    {
      label: "Needs setup",
      value: String(missingSupplierCount + missingCategoryCount),
      helper: "Missing supplier or category",
    },
  ];
}

function filterAndSortProducts(
  products: ProductPreview[],
  filters: ProductFilters,
  categories: CategoryPreview[],
  suppliers: Supplier[],
) {
  const normalizedSearch = filters.search.trim().toLowerCase();
  return products
    .filter((product) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        product.nameUk,
        product.nameRu,
        product.sku,
        product.brand,
        product.supplierName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .filter((product) => {
      if (filters.supplierId === "all") {
        return true;
      }

      if (filters.supplierId === "missing") {
        return !product.supplierId;
      }

      return product.supplierId === filters.supplierId;
    })
    .filter((product) => {
      if (filters.categoryId === "all") {
        return true;
      }

      if (filters.categoryId === "missing") {
        return (
          !product.categoryId ||
          !categories.some((category) => category.id === product.categoryId)
        );
      }

      return product.categoryId === filters.categoryId;
    })
    .filter((product) => {
      const publicationStatus = getProductPublicationStatus(product);

      if (filters.publication === "all") {
        return true;
      }

      if (filters.publication === "unpublished") {
        return publicationStatus !== "published";
      }

      return publicationStatus === filters.publication;
    })
    .filter((product) => {
      if (filters.stock === "all") {
        return true;
      }

      if (filters.stock === "in-stock") {
        return product.status === "active" && product.stock > 0;
      }

      if (filters.stock === "out-of-stock") {
        return isOutOfStock(product);
      }

      return product.status === "active" && product.stock > 0 && product.stock <= 10;
    })
    .filter((product) => {
      if (filters.age === "all") {
        return true;
      }

      if (filters.age === "old") {
        return isOlderThan(product.createdAt, oldProductDays);
      }

      return isWithinDays(product.updatedAt, recentUpdateDays);
    })
    .sort((a, b) => sortProducts(a, b, filters.sort, suppliers));
}

function sortProducts(
  a: ProductPreview,
  b: ProductPreview,
  sort: ProductSortOption,
  suppliers: Supplier[],
) {
  if (sort === "name") {
    return getProductName(a, "uk").localeCompare(getProductName(b, "uk"));
  }

  if (sort === "created-desc") {
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }

  if (sort === "created-asc") {
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  }

  if (sort === "price-asc") {
    return getProductDisplayPrice(a) - getProductDisplayPrice(b);
  }

  if (sort === "price-desc") {
    return getProductDisplayPrice(b) - getProductDisplayPrice(a);
  }

  if (sort === "stock-asc") {
    return a.stock - b.stock;
  }

  if (sort === "stock-desc") {
    return b.stock - a.stock;
  }

  const supplierTieBreak =
    getSupplierName(a, suppliers).localeCompare(getSupplierName(b, suppliers));

  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || supplierTieBreak;
}

function getProductIndicators(
  product: ProductPreview,
  categories: CategoryPreview[],
) {
  const indicators: string[] = [];
  const publicationStatus = getProductPublicationStatus(product);

  if (publicationStatus !== "published") {
    indicators.push(publicationLabels[publicationStatus]);
  }

  if (isOutOfStock(product)) {
    indicators.push("Out of stock");
  } else if (product.status === "active" && product.stock > 0 && product.stock <= 10) {
    indicators.push("Low stock");
  }

  if (isProductDiscounted(product)) {
    indicators.push(`Sale -${getProductDiscountPercent(product)}%`);
  } else if (typeof product.salePrice === "number" && product.salePrice > 0) {
    indicators.push("Sale price ignored");
  }

  if (!product.supplierId) {
    indicators.push("Missing supplier");
  }

  if (
    !product.categoryId ||
    !categories.some((category) => category.id === product.categoryId)
  ) {
    indicators.push("Missing category");
  }

  if (isOlderThan(product.createdAt, oldProductDays)) {
    indicators.push("Old product");
  }

  if (isWithinDays(product.priceUpdatedAt, recentPriceUpdateDays)) {
    indicators.push("Price updated");
  }

  if (product.seo?.pinInSearch) {
    indicators.push("Search pinned");
  } else if (
    typeof product.seo?.searchBoost === "number" &&
    product.seo.searchBoost > 0
  ) {
    indicators.push(`Search +${product.seo.searchBoost}`);
  }

  return indicators;
}

function getEmptyProductSeo(): ProductSeo {
  return {
    title: { uk: "", ru: "" },
    metaDescription: { uk: "", ru: "" },
    focusKeyword: { uk: "", ru: "" },
    longTailKeywords: { uk: "", ru: "" },
    features: { uk: "", ru: "" },
    suitableFor: { uk: "", ru: "" },
    faq: [],
    internalLinks: [],
    schemaEnabled: true,
    searchBoost: 0,
    pinInSearch: false,
  };
}

function normalizeProductSeo(seo: ProductSeo | undefined): Required<
  Pick<
    ProductSeo,
    | "title"
    | "metaDescription"
    | "focusKeyword"
    | "longTailKeywords"
    | "features"
    | "suitableFor"
    | "faq"
    | "internalLinks"
  >
> &
  Pick<ProductSeo, "schemaEnabled" | "searchBoost" | "pinInSearch"> {
  const emptySeo = getEmptyProductSeo();

  return {
    title: { ...emptySeo.title, ...seo?.title },
    metaDescription: {
      ...emptySeo.metaDescription,
      ...seo?.metaDescription,
    },
    focusKeyword: { ...emptySeo.focusKeyword, ...seo?.focusKeyword },
    longTailKeywords: {
      ...emptySeo.longTailKeywords,
      ...seo?.longTailKeywords,
    },
    features: { ...emptySeo.features, ...seo?.features },
    suitableFor: { ...emptySeo.suitableFor, ...seo?.suitableFor },
    faq: Array.isArray(seo?.faq) ? seo.faq : [],
    internalLinks: Array.isArray(seo?.internalLinks) ? seo.internalLinks : [],
    schemaEnabled: seo?.schemaEnabled ?? true,
    searchBoost: seo?.searchBoost ?? 0,
    pinInSearch: seo?.pinInSearch ?? false,
  };
}

function getSeoCompletionScore(product: ProductPreview, seo: ProductSeo) {
  const checks = [
    seo.title?.uk || seo.title?.ru,
    seo.metaDescription?.uk || seo.metaDescription?.ru,
    seo.focusKeyword?.uk || seo.focusKeyword?.ru,
    seo.longTailKeywords?.uk || seo.longTailKeywords?.ru,
    seo.features?.uk || seo.features?.ru || product.descriptionUk,
    seo.suitableFor?.uk || seo.suitableFor?.ru || product.skinType,
    (seo.faq ?? []).some(
      (item) =>
        (item.question.uk || item.question.ru) && (item.answer.uk || item.answer.ru),
    ),
    product.slug,
    product.images.length > 0,
    seo.schemaEnabled !== false,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function normalizeSlugInput(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"`]+/g, "")
    .replace(/[^a-z0-9а-яёіїєґ-]+/giu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isOutOfStock(product: ProductPreview) {
  return product.status === "out_of_stock" || product.stock <= 0;
}

function getSupplierName(product: ProductPreview, suppliers: Supplier[]) {
  return (
    suppliers.find((supplier) => supplier.id === product.supplierId)?.name ??
    product.supplierName ??
    ""
  );
}

function isOlderThan(value: string | undefined, days: number) {
  const timestamp = value ? Date.parse(value) : Number.NaN;

  return Number.isFinite(timestamp)
    ? Date.now() - timestamp > days * 24 * 60 * 60 * 1000
    : false;
}

function isWithinDays(value: string | undefined, days: number) {
  const timestamp = value ? Date.parse(value) : Number.NaN;

  return Number.isFinite(timestamp)
    ? Date.now() - timestamp <= days * 24 * 60 * 60 * 1000
    : false;
}

function formatAdminDate(value: string | undefined) {
  const timestamp = value ? Date.parse(value) : Number.NaN;

  if (!Number.isFinite(timestamp)) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function hasOwn<T extends object>(value: T, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
