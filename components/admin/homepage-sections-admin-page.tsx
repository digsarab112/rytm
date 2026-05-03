"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

import {
  AdminActionFeedback,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  SelectField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_CATEGORIES_STORAGE_KEY,
  ADMIN_HOMEPAGE_STORAGE_KEY,
  ADMIN_PRODUCTS_STORAGE_KEY,
  createAdminId,
} from "@/lib/admin/storage";
import { getCategoryName, getProductName } from "@/lib/catalog/helpers";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/catalog/category-tree";
import type {
  CategoryPreview,
  HomepageSection,
  HomepageSectionType,
  ProductPreview,
} from "@/types/store";

type HomepageSectionsAdminPageProps = {
  initialSections: HomepageSection[];
  products: ProductPreview[];
  categories: CategoryPreview[];
};

const sectionLabels: Record<HomepageSectionType, string> = {
  hero: "Hero",
  featuredCategories: "Featured categories",
  productCarousel: "Product carousel",
  promoBanner: "Promo banner",
  benefits: "Benefits",
  reviews: "Reviews",
  deliveryInfo: "Delivery/payment info",
  newsletter: "Newsletter",
};

export function HomepageSectionsAdminPage({
  initialSections,
  products,
  categories,
}: HomepageSectionsAdminPageProps) {
  const [sections, setSections] = useLocalStorageState(
    ADMIN_HOMEPAGE_STORAGE_KEY,
    initialSections,
  );
  const [adminProducts] = useLocalStorageState(
    ADMIN_PRODUCTS_STORAGE_KEY,
    products,
  );
  const [adminCategories] = useLocalStorageState(
    ADMIN_CATEGORIES_STORAGE_KEY,
    categories,
  );
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections],
  );
  const categoryOptions = useMemo(
    () => flattenCategoryTree(buildCategoryTree(adminCategories)),
    [adminCategories],
  );
  const productOptions = useMemo(
    () => adminProducts.filter((product) => product.publicationStatus !== "archived"),
    [adminProducts],
  );

  function updateSection(sectionId: string, updates: Partial<HomepageSection>) {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    );
  }

  function moveSection(sectionId: string, direction: "up" | "down") {
    const currentIndex = sortedSections.findIndex(
      (section) => section.id === sectionId,
    );
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedSections.length) {
      return;
    }

    const current = sortedSections[currentIndex];
    const target = sortedSections[targetIndex];

    setSections((currentSections) =>
      currentSections.map((section) => {
        if (section.id === current.id) {
          return { ...section, sortOrder: target.sortOrder };
        }

        if (section.id === target.id) {
          return { ...section, sortOrder: current.sortOrder };
        }

        return section;
      }),
    );
  }

  function addProductCarousel() {
    const nextSortOrder =
      sortedSections.reduce(
        (highest, section) => Math.max(highest, section.sortOrder),
        0,
      ) + 10;

    setSections((currentSections) => [
      ...currentSections,
      {
        id: createAdminId("homepage-carousel"),
        type: "productCarousel",
        isVisible: true,
        sortOrder: nextSortOrder,
        variant: "bestSellers",
        title: { uk: "Добірка", ru: "Подборка" },
        config: { productSource: "manual", productIds: [], limit: 8 },
      },
    ]);
  }

  function deleteSection(sectionId: string) {
    setSections((currentSections) =>
      currentSections.filter((section) => section.id !== sectionId),
    );
  }

  function toggleManualProduct(section: HomepageSection, productId: string) {
    const currentIds = section.config?.productIds ?? [];
    const nextIds = currentIds.includes(productId)
      ? currentIds.filter((id) => id !== productId)
      : [...currentIds, productId];

    updateSection(section.id, {
      config: { ...section.config, productSource: "manual", productIds: nextIds },
    });
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Homepage sections"
        description="Control which homepage sections are visible, their order, and product carousel purpose."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending("add-product-carousel")}
              onClick={() =>
                runAction(
                  "add-product-carousel",
                  addProductCarousel,
                  "Product carousel added.",
                )
              }
            >
              <Plus />
              New carousel
            </Button>
            <Button
              type="button"
              disabled={isPending("save-homepage-sections")}
              onClick={() =>
                runAction(
                  "save-homepage-sections",
                  () => undefined,
                  "Homepage section settings saved.",
                )
              }
            >
              <Save />
              {isPending("save-homepage-sections")
                ? "Saving..."
                : "Saved automatically"}
            </Button>
          </div>
        }
      />
      <div className="grid gap-4">
        {sortedSections.map((section, index) => (
          <AdminCard key={section.id}>
            <div className="grid gap-4 lg:grid-cols-[1fr_160px_170px_180px] lg:items-end">
              <div>
                <p className="text-lg font-bold text-foreground">
                  {sectionLabels[section.type]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Section ID: {section.id}
                </p>
              </div>
              <TextField
                label="Sort order"
                type="number"
                value={section.sortOrder}
                onChange={(sortOrder) =>
                  updateSection(section.id, {
                    sortOrder: Number(sortOrder) || 0,
                  })
                }
              />
              <ToggleField
                label="Visible"
                checked={section.isVisible}
                onChange={(isVisible) =>
                  updateSection(section.id, { isVisible })
                }
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move section up"
                  disabled={index === 0}
                  onClick={() =>
                    runAction(
                      `move-up-${section.id}`,
                      () => moveSection(section.id, "up"),
                      "Section order updated.",
                    )
                  }
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move section down"
                  disabled={index === sortedSections.length - 1}
                  onClick={() =>
                    runAction(
                      `move-down-${section.id}`,
                      () => moveSection(section.id, "down"),
                      "Section order updated.",
                    )
                  }
                >
                  <ArrowDown />
                </Button>
              </div>
            </div>
            {section.type === "productCarousel" ? (
              <div className="mt-4 grid gap-4 rounded-lg border border-border bg-background p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <TextField
                    label="Title Ukrainian"
                    value={section.title?.uk ?? ""}
                    onChange={(uk) =>
                      updateSection(section.id, {
                        title: { ...section.title, uk },
                      })
                    }
                  />
                  <TextField
                    label="Title Russian"
                    value={section.title?.ru ?? ""}
                    onChange={(ru) =>
                      updateSection(section.id, {
                        title: { ...section.title, ru },
                      })
                    }
                  />
                  <TextField
                    label="Product limit"
                    type="number"
                    value={section.config?.limit ?? 8}
                    onChange={(limit) =>
                      updateSection(section.id, {
                        config: {
                          ...section.config,
                          limit: Number(limit) || 8,
                        },
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending(`delete-${section.id}`)}
                    onClick={() =>
                      runAction(
                        `delete-${section.id}`,
                        () => deleteSection(section.id),
                        "Section removed.",
                      )
                    }
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
                <SelectField
                  label="Product source"
                  value={section.config?.productSource ?? section.variant ?? "bestSellers"}
                  onChange={(source) =>
                    updateSection(section.id, {
                      variant:
                        source === "bestSellers" || source === "newArrivals"
                          ? (source as HomepageSection["variant"])
                          : section.variant,
                      config: {
                        ...section.config,
                        productSource: source as NonNullable<
                          HomepageSection["config"]
                        >["productSource"],
                      },
                    })
                  }
                >
                  <option value="bestSellers">Best sellers</option>
                  <option value="newArrivals">New arrivals</option>
                  <option value="manual">Manual selection</option>
                  <option value="category">Category products</option>
                </SelectField>
                {section.config?.productSource === "category" ? (
                  <SelectField
                    label="Category"
                    value={section.config?.categoryId ?? ""}
                    onChange={(categoryId) =>
                      updateSection(section.id, {
                        config: { ...section.config, categoryId },
                      })
                    }
                  >
                    <option value="">Choose category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {"  ".repeat(category.depth)}
                        {getCategoryName(category, "uk")}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
                {section.config?.productSource === "manual" ? (
                  <div className="grid gap-3">
                    <p className="text-sm font-bold text-foreground">
                      Manual products
                    </p>
                    <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border bg-card p-3 md:grid-cols-2">
                      {productOptions.map((product) => {
                        const checked = (section.config?.productIds ?? []).includes(
                          product.id,
                        );

                        return (
                          <label
                            key={product.id}
                            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
                          >
                            <Input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleManualProduct(section, product.id)
                              }
                              className="size-4"
                            />
                            <span>{getProductName(product, "uk")}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
