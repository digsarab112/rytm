"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Search, Trash2 } from "lucide-react";

import {
  AdminActionFeedback,
  type AdminActionRunner,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import { AdminImageUploadField } from "@/components/admin/image-upload-field";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_CATEGORIES_STORAGE_KEY, createAdminId } from "@/lib/admin/storage";
import {
  buildCategoryTree,
  type CategoryTreeNode,
  wouldCreateCategoryCycle,
} from "@/lib/catalog/category-tree";
import { getCategoryName } from "@/lib/catalog/helpers";
import type { CategoryPreview, VisualTone } from "@/types/store";

type CategoriesAdminPageProps = {
  initialCategories: CategoryPreview[];
};

const tones: VisualTone[] = ["rose", "sage", "cream", "linen"];

export function CategoriesAdminPage({
  initialCategories,
}: CategoriesAdminPageProps) {
  const [categories, setCategories] = useLocalStorageState(
    ADMIN_CATEGORIES_STORAGE_KEY,
    initialCategories,
  );
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");
  const [categorySearch, setCategorySearch] = useState("");
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const visibleCategoryTree = useMemo(
    () => filterCategoryTree(categoryTree, categorySearch),
    [categorySearch, categoryTree],
  );
  const mainCategoryOptions = useMemo(
    () => categoryTree.filter((category) => category.depth === 0),
    [categoryTree],
  );
  const selectedCategory =
    categories.find((category) => category.id === selectedId) ?? categories[0];

  function updateCategory(
    categoryId: string,
    updates: Partial<CategoryPreview>,
  ) {
    setCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, ...updates } : category,
      ),
    );
  }

  function createCategory(parentId?: string) {
    const categoryId = createAdminId("category");
    const slugSuffix = Date.now().toString(36);

    setCategories((currentCategories) => {
      const parentCategory = parentId
        ? currentCategories.find((category) => category.id === parentId)
        : undefined;
      const effectiveParentId = parentCategory?.id;
      const siblingCategories = currentCategories.filter(
        (category) => (category.parentId ?? "") === (effectiveParentId ?? ""),
      );
      const isSubcategory = Boolean(effectiveParentId);
      const category: CategoryPreview = {
        id: categoryId,
        parentId: effectiveParentId,
        nameUk: isSubcategory ? "Підкатегорія догляду" : "Категорія догляду",
        nameRu: isSubcategory ? "Подкатегория ухода" : "Категория ухода",
        slug: `${isSubcategory ? "subcategory" : "category"}-${slugSuffix}`,
        descriptionUk: "",
        descriptionRu: "",
        sortOrder:
          Math.max(0, ...siblingCategories.map((item) => item.sortOrder)) + 10,
        isActive: true,
        showInHeader: parentCategory ? parentCategory.showInHeader : true,
        showOnHomepage: false,
        showInCatalogNavigation: true,
        image: parentCategory?.image ?? "/visuals/realistic/category-face.jpg",
        tone: parentCategory?.tone ?? "cream",
      };

      return [...currentCategories, category];
    });
    setSelectedId(categoryId);
  }

  function deleteCategory(categoryId: string) {
    setCategories((currentCategories) =>
      currentCategories
        .filter((category) => category.id !== categoryId)
        .map((category) =>
          category.parentId === categoryId
            ? { ...category, parentId: undefined }
            : category,
        ),
    );
    setSelectedId(
      categories.find((category) => category.id !== categoryId)?.id ?? "",
    );
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Categories"
        description="Create category structure, localized names, descriptions, visibility, and menu placement."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isPending("create-category")}
              onClick={() =>
                runAction(
                  "create-category",
                  () => createCategory(),
                  "Main category created.",
                )
              }
            >
              <Plus />
              {isPending("create-category") ? "Creating..." : "New main category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                runAction(
                  "create-subcategory",
                  () =>
                    createCategory(
                      selectedCategory
                        ? getMainCategoryId(selectedCategory, categories)
                        : undefined,
                    ),
                  "Subcategory created.",
                )
              }
              disabled={!selectedCategory || isPending("create-subcategory")}
              title={
                selectedCategory
                  ? `Create under ${getCategoryName(selectedCategory, "uk")}`
                  : undefined
              }
            >
              <Plus />
              {isPending("create-subcategory") ? "Creating..." : "New subcategory"}
            </Button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AdminCard
          title="Category list"
          description="Main categories are grouped with their own subcategories so the structure stays easy to scan."
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search category or subcategory"
              className="pl-9"
            />
          </div>
          <div className="grid gap-3">
            {visibleCategoryTree.length > 0 ? (
              visibleCategoryTree.map((category) => (
                <CategoryTreeButton
                  key={category.id}
                  category={category}
                  selectedId={selectedCategory?.id ?? ""}
                  onSelect={setSelectedId}
                />
              ))
            ) : (
              <EmptyState text="No categories match the search." />
            )}
          </div>
        </AdminCard>
        {selectedCategory ? (
          <CategoryEditor
            category={selectedCategory}
            categories={mainCategoryOptions}
            onChange={(updates) =>
              updateCategory(selectedCategory.id, updates)
            }
            onDelete={() => deleteCategory(selectedCategory.id)}
            runAction={runAction}
            isPending={isPending}
          />
        ) : (
          <EmptyState text="No categories yet." />
        )}
      </div>
    </div>
  );
}

function CategoryTreeButton({
  category,
  selectedId,
  onSelect,
}: {
  category: CategoryTreeNode;
  selectedId: string;
  onSelect: (categoryId: string) => void;
}) {
  const selected = category.id === selectedId;
  const isSubcategory = category.depth > 0;

  return (
    <div
      className={
        isSubcategory
          ? "grid gap-2 border-l border-border pl-3"
          : "rounded-lg border border-border bg-background p-2"
      }
    >
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
          selected
            ? "border-primary bg-secondary"
            : isSubcategory
              ? "border-border bg-card hover:bg-muted"
              : "border-transparent bg-background hover:bg-muted"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-normal ${
                  isSubcategory
                    ? "bg-card text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {isSubcategory ? "Subcategory" : "Main"}
              </span>
              <p className="font-bold text-foreground">
                {getCategoryName(category, "uk")}
              </p>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              /{category.slug}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
            {category.children.length > 0
              ? `${category.children.length} sub`
              : category.isActive
                ? "Active"
                : "Hidden"}
          </span>
        </div>
      </button>
      {category.children.length > 0 ? (
        <div className="grid gap-2 pl-3">
          {category.children.map((child) => (
            <CategoryTreeButton
              key={child.id}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function filterCategoryTree(
  categories: CategoryTreeNode[],
  search: string,
): CategoryTreeNode[] {
  const normalizedSearch = normalizeCategorySearch(search);

  if (!normalizedSearch) {
    return categories;
  }

  return categories
    .map((category) => {
      const children = filterCategoryTree(category.children, search);
      const matches = categoryMatchesSearch(category, normalizedSearch);

      return matches || children.length > 0
        ? { ...category, children }
        : undefined;
    })
    .filter((category): category is CategoryTreeNode => Boolean(category));
}

function categoryMatchesSearch(
  category: CategoryPreview,
  normalizedSearch: string,
) {
  return (
    normalizeCategorySearch(category.nameUk).includes(normalizedSearch) ||
    normalizeCategorySearch(category.nameRu).includes(normalizedSearch) ||
    normalizeCategorySearch(category.slug).includes(normalizedSearch)
  );
}

function getMainCategoryId(
  category: CategoryPreview,
  categories: CategoryPreview[],
) {
  if (!category.parentId) {
    return category.id;
  }

  return categories.find((item) => item.id === category.parentId)?.id ?? category.id;
}

function normalizeCategorySearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}

function CategoryEditor({
  category,
  categories,
  onChange,
  onDelete,
  runAction,
  isPending,
}: {
  category: CategoryPreview;
  categories: CategoryTreeNode[];
  onChange: (updates: Partial<CategoryPreview>) => void;
  onDelete: () => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  const parentOptions = categories.filter(
    (item) =>
      item.id !== category.id &&
      item.depth === 0 &&
      !wouldCreateCategoryCycle(categories, category.id, item.id),
  );

  return (
    <AdminCard
      title="Category editor"
      description="Manage localized content and decide where this category appears."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Name Ukrainian"
            value={category.nameUk}
            onChange={(nameUk) => onChange({ nameUk })}
          />
          <TextField
            label="Name Russian"
            value={category.nameRu}
            onChange={(nameRu) => onChange({ nameRu })}
          />
          <TextField
            label="Slug"
            value={category.slug}
            onChange={(slug) => onChange({ slug })}
          />
          <SelectField
            label="Parent category"
            value={category.parentId ?? ""}
            onChange={(parentId) =>
              onChange({ parentId: parentId || undefined })
            }
          >
            <option value="">Main category</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {getCategoryName(item, "uk")}
              </option>
            ))}
          </SelectField>
          <AdminImageUploadField
            label="Category image"
            value={category.image ?? ""}
            purpose="category"
            tone={category.tone}
            previewClassName="aspect-[16/6]"
            onChange={(image) => onChange({ image })}
          />
          <TextField
            label="Icon reference"
            value={category.icon ?? ""}
            onChange={(icon) => onChange({ icon })}
          />
          <TextField
            label="Sort order"
            type="number"
            value={category.sortOrder}
            onChange={(sortOrder) =>
              onChange({ sortOrder: Number(sortOrder) || 0 })
            }
          />
          <SelectField
            label="Visual tone"
            value={category.tone}
            onChange={(tone) => onChange({ tone: tone as VisualTone })}
          >
            {tones.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            label="Description Ukrainian"
            value={category.descriptionUk}
            onChange={(descriptionUk) => onChange({ descriptionUk })}
          />
          <TextAreaField
            label="Description Russian"
            value={category.descriptionRu}
            onChange={(descriptionRu) => onChange({ descriptionRu })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <ToggleField
            label="Active"
            checked={category.isActive}
            onChange={(isActive) => onChange({ isActive })}
          />
          <ToggleField
            label="Show in header"
            checked={category.showInHeader}
            onChange={(showInHeader) => onChange({ showInHeader })}
          />
          <ToggleField
            label="Show on homepage"
            checked={category.showOnHomepage}
            onChange={(showOnHomepage) => onChange({ showOnHomepage })}
          />
          <ToggleField
            label="Show in catalog navigation"
            checked={category.showInCatalogNavigation ?? true}
            onChange={(showInCatalogNavigation) =>
              onChange({ showInCatalogNavigation })
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isPending(`save-category-${category.id}`)}
            onClick={() =>
              runAction(
                `save-category-${category.id}`,
                () => undefined,
                "Category changes saved.",
              )
            }
          >
            <Save />
            {isPending(`save-category-${category.id}`)
              ? "Saving..."
              : "Saved automatically"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`delete-category-${category.id}`)}
            onClick={() =>
              runAction(
                `delete-category-${category.id}`,
                onDelete,
                "Category deleted.",
              )
            }
          >
            <Trash2 />
            {isPending(`delete-category-${category.id}`)
              ? "Deleting..."
              : "Delete category"}
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
