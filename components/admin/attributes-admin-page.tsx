"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import {
  AdminActionFeedback,
  type AdminActionRunner,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  SelectField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/catalog/category-tree";
import {
  ADMIN_ATTRIBUTES_STORAGE_KEY,
  ADMIN_CATEGORIES_STORAGE_KEY,
  createAdminId,
} from "@/lib/admin/storage";
import { getCategoryName } from "@/lib/catalog/helpers";
import type {
  AttributeType,
  CategoryPreview,
  ProductAttributeDefinition,
} from "@/types/store";

type AttributesAdminPageProps = {
  initialDefinitions: ProductAttributeDefinition[];
  initialCategories: CategoryPreview[];
};

const attributeTypes: AttributeType[] = [
  "text",
  "number",
  "boolean",
  "select",
  "multiselect",
];

export function AttributesAdminPage({
  initialDefinitions,
  initialCategories,
}: AttributesAdminPageProps) {
  const [definitions, setDefinitions] = useLocalStorageState(
    ADMIN_ATTRIBUTES_STORAGE_KEY,
    initialDefinitions,
  );
  const [categories] = useLocalStorageState(
    ADMIN_CATEGORIES_STORAGE_KEY,
    initialCategories,
  );
  const [selectedId, setSelectedId] = useState(definitions[0]?.id ?? "");
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const sortedDefinitions = useMemo(
    () => [...definitions].sort((a, b) => a.sortOrder - b.sortOrder),
    [definitions],
  );
  const selectedDefinition =
    definitions.find((definition) => definition.id === selectedId) ??
    definitions[0];

  function createDefinition() {
    const definition: ProductAttributeDefinition = {
      id: createAdminId("attribute"),
      slug: `attribute-${Date.now().toString(36)}`,
      nameUk: "New attribute",
      nameRu: "New attribute",
      type: "text",
      isFilterable: false,
      sortOrder:
        Math.max(0, ...definitions.map((item) => item.sortOrder)) + 10,
    };

    setDefinitions((currentDefinitions) => [definition, ...currentDefinitions]);
    setSelectedId(definition.id);
  }

  function updateDefinition(
    definitionId: string,
    updates: Partial<ProductAttributeDefinition>,
  ) {
    setDefinitions((currentDefinitions) =>
      currentDefinitions.map((definition) =>
        definition.id === definitionId
          ? { ...definition, ...updates }
          : definition,
      ),
    );
  }

  function deleteDefinition(definitionId: string) {
    setDefinitions((currentDefinitions) =>
      currentDefinitions.filter((definition) => definition.id !== definitionId),
    );
    setSelectedId(
      definitions.find((definition) => definition.id !== definitionId)?.id ?? "",
    );
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Product attributes"
        description="Manage reusable product attributes for filtering, product details, and future category-specific catalogs."
        action={
          <Button
            type="button"
            disabled={isPending("create-attribute")}
            onClick={() =>
              runAction(
                "create-attribute",
                createDefinition,
                "Attribute created.",
              )
            }
          >
            <Plus />
            {isPending("create-attribute") ? "Creating..." : "New attribute"}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AdminCard title="Attribute definitions">
          <div className="grid gap-2">
            {sortedDefinitions.map((definition) => (
              <button
                key={definition.id}
                type="button"
                onClick={() => setSelectedId(definition.id)}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  definition.id === selectedDefinition?.id
                    ? "border-primary bg-secondary"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">
                      {definition.nameUk}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      attr_{definition.slug}
                    </p>
                  </div>
                  <span className="rounded-full bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {definition.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </AdminCard>
        {selectedDefinition ? (
          <AttributeEditor
            definition={selectedDefinition}
            categories={categories}
            onChange={(updates) =>
              updateDefinition(selectedDefinition.id, updates)
            }
            onDelete={() => deleteDefinition(selectedDefinition.id)}
            runAction={runAction}
            isPending={isPending}
          />
        ) : (
          <EmptyState text="No product attributes yet." />
        )}
      </div>
    </div>
  );
}

function AttributeEditor({
  definition,
  categories,
  onChange,
  onDelete,
  runAction,
  isPending,
}: {
  definition: ProductAttributeDefinition;
  categories: CategoryPreview[];
  onChange: (updates: Partial<ProductAttributeDefinition>) => void;
  onDelete: () => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  const scopedCategoryIds = definition.categoryIds ?? [];
  const categoryOptions = flattenCategoryTree(buildCategoryTree(categories));

  function toggleCategory(categoryId: string, checked: boolean) {
    const nextCategoryIds = checked
      ? [...scopedCategoryIds, categoryId]
      : scopedCategoryIds.filter((id) => id !== categoryId);

    onChange({
      categoryIds: nextCategoryIds.length > 0 ? nextCategoryIds : undefined,
    });
  }

  return (
    <AdminCard
      title="Attribute editor"
      description="Define localized labels, data type, filter behavior, sort order, and category scope."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Name Ukrainian"
            value={definition.nameUk}
            onChange={(nameUk) => onChange({ nameUk })}
          />
          <TextField
            label="Name Russian"
            value={definition.nameRu}
            onChange={(nameRu) => onChange({ nameRu })}
          />
          <TextField
            label="Slug"
            value={definition.slug}
            onChange={(slug) => onChange({ slug })}
          />
          <SelectField
            label="Attribute type"
            value={definition.type}
            onChange={(type) => onChange({ type: type as AttributeType })}
          >
            {attributeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Sort order"
            type="number"
            value={definition.sortOrder}
            onChange={(sortOrder) =>
              onChange({ sortOrder: Number(sortOrder) || 0 })
            }
          />
          <ToggleField
            label="Use as catalog filter"
            checked={definition.isFilterable}
            onChange={(isFilterable) => onChange({ isFilterable })}
          />
        </div>
        <section>
          <h3 className="text-sm font-bold text-foreground">Category scope</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave all unchecked to make the attribute available across the catalog.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {categoryOptions.map((category) => (
              <ToggleField
                key={category.id}
                label={`${"  ".repeat(category.depth)}${getCategoryName(category, "uk")}`}
                checked={scopedCategoryIds.includes(category.id)}
                onChange={(checked) => toggleCategory(category.id, checked)}
              />
            ))}
          </div>
        </section>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isPending(`save-attribute-${definition.id}`)}
            onClick={() =>
              runAction(
                `save-attribute-${definition.id}`,
                () => undefined,
                "Attribute changes saved.",
              )
            }
          >
            <Save />
            {isPending(`save-attribute-${definition.id}`)
              ? "Saving..."
              : "Saved automatically"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`delete-attribute-${definition.id}`)}
            onClick={() =>
              runAction(
                `delete-attribute-${definition.id}`,
                onDelete,
                "Attribute deleted.",
              )
            }
          >
            <Trash2 />
            {isPending(`delete-attribute-${definition.id}`)
              ? "Deleting..."
              : "Delete attribute"}
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
