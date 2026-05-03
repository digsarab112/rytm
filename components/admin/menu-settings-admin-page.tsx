"use client";

import { useMemo } from "react";
import { Save } from "lucide-react";

import {
  AdminActionFeedback,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { ADMIN_CATEGORIES_STORAGE_KEY } from "@/lib/admin/storage";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/catalog/category-tree";
import { getCategoryName } from "@/lib/catalog/helpers";
import type { CategoryPreview } from "@/types/store";

type MenuSettingsAdminPageProps = {
  initialCategories: CategoryPreview[];
};

export function MenuSettingsAdminPage({
  initialCategories,
}: MenuSettingsAdminPageProps) {
  const [categories, setCategories] = useLocalStorageState(
    ADMIN_CATEGORIES_STORAGE_KEY,
    initialCategories,
  );
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const sortedCategories = useMemo(
    () => flattenCategoryTree(buildCategoryTree(categories)),
    [categories],
  );

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

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Menu settings"
        description="Choose active categories, header menu categories, homepage categories, and catalog ordering."
        action={
          <Button
            type="button"
            disabled={isPending("save-menu")}
            onClick={() =>
              runAction(
                "save-menu",
                () => undefined,
                "Menu settings saved.",
              )
            }
          >
            <Save />
            {isPending("save-menu") ? "Saving..." : "Saved automatically"}
          </Button>
        }
      />
      <AdminCard
        title="Catalog navigation"
        description="Use sort order and parent categories to shape the top menu, homepage blocks, and catalog filter navigation."
      >
        <div className="grid gap-3">
          {sortedCategories.map((category) => (
            <section
              key={category.id}
              className="grid gap-4 rounded-lg border border-border bg-background p-4 xl:grid-cols-[1fr_130px_150px_170px_190px_230px]"
            >
              <div style={{ paddingLeft: `${category.depth * 18}px` }}>
                <p className="font-bold text-foreground">
                  {getCategoryName(category, "uk")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  /{category.slug}
                </p>
              </div>
              <TextField
                label="Order"
                type="number"
                value={category.sortOrder}
                onChange={(sortOrder) =>
                  updateCategory(category.id, {
                    sortOrder: Number(sortOrder) || 0,
                  })
                }
              />
              <ToggleField
                label="Active"
                checked={category.isActive}
                onChange={(isActive) =>
                  updateCategory(category.id, { isActive })
                }
              />
              <ToggleField
                label="Show in header"
                checked={category.showInHeader}
                onChange={(showInHeader) =>
                  updateCategory(category.id, { showInHeader })
                }
              />
              <ToggleField
                label="Show on homepage"
                checked={category.showOnHomepage}
                onChange={(showOnHomepage) =>
                  updateCategory(category.id, { showOnHomepage })
                }
              />
              <ToggleField
                label="Show in catalog nav"
                checked={category.showInCatalogNavigation ?? true}
                onChange={(showInCatalogNavigation) =>
                  updateCategory(category.id, { showInCatalogNavigation })
                }
              />
            </section>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
