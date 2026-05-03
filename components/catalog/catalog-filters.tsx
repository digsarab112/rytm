"use client";

import {
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildCategoryTree,
  type CategoryTreeNode,
} from "@/lib/catalog/category-tree";
import type { CatalogFilters } from "@/lib/catalog/helpers";
import { getAttributeName, getCategoryName } from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { CategoryPreview, ProductAttributeDefinition } from "@/types/store";

type AttributeFilter = {
  definition: ProductAttributeDefinition;
  options: [string, string][];
};

type CatalogFiltersProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories?: CategoryPreview[];
  brands?: string[];
  attributeFilters?: AttributeFilter[];
  filters: CatalogFilters;
  filterContext?: string;
};

type FilterCopy = {
  activeFilters: string;
  showFilters: string;
  editFilters: string;
  saleOnly: string;
  rating: string;
  anyRating: string;
  starsUp: string;
  reset: string;
  sortRating: string;
  quickSort: string;
};

const copyByLocale: Record<Locale, FilterCopy> = {
  uk: {
    activeFilters: "активних",
    showFilters: "Фільтри",
    editFilters: "Налаштувати",
    saleOnly: "Тільки акційні",
    rating: "Рейтинг",
    anyRating: "Будь-який рейтинг",
    starsUp: "зірки і вище",
    reset: "Скинути",
    sortRating: "За рейтингом",
    quickSort: "Сортування",
  },
  ru: {
    activeFilters: "активных",
    showFilters: "Фильтры",
    editFilters: "Настроить",
    saleOnly: "Только акции",
    rating: "Рейтинг",
    anyRating: "Любой рейтинг",
    starsUp: "звезды и выше",
    reset: "Сбросить",
    sortRating: "По рейтингу",
    quickSort: "Сортировка",
  },
};

export function CatalogFiltersPanel({
  filters,
  ...props
}: CatalogFiltersProps) {
  return (
    <CatalogFiltersPanelState
      key={JSON.stringify(filters)}
      filters={filters}
      {...props}
    />
  );
}

function CatalogFiltersPanelState({
  locale,
  dictionary,
  categories = [],
  brands = [],
  attributeFilters = [],
  filters,
  filterContext,
}: CatalogFiltersProps) {
  const router = useRouter();
  const copy = copyByLocale[locale];
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [q, setQ] = useState(filters.q ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [brand, setBrand] = useState(filters.brand ?? "");
  const [attributeValues, setAttributeValues] = useState(
    filters.attributes ?? {},
  );
  const [availability, setAvailability] = useState(filters.availability ?? "");
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const [saleOnly, setSaleOnly] = useState(Boolean(filters.saleOnly));
  const [minRating, setMinRating] = useState(
    filters.minRating?.toString() ?? "",
  );
  const [sort, setSort] = useState(filters.sort);

  const categoryTree = useMemo(
    () =>
      buildCategoryTree(categories, {
        activeOnly: true,
        catalogNavigationOnly: true,
      }),
    [categories],
  );

  const activeFilterCount = getActiveFilterCount(filters);

  function createQuery(nextSort = sort) {
    const params = new URLSearchParams();
    const entries = {
      q,
      category,
      brand,
      availability,
      minPrice,
      maxPrice,
      minRating,
      sort: nextSort,
    };

    Object.entries(entries).forEach(([key, value]) => {
      const normalized = value.trim();
      if (normalized && !(key === "sort" && normalized === "newest")) {
        params.set(key, normalized);
      }
    });

    if (saleOnly) {
      params.set("sale", "1");
    }

    Object.entries(attributeValues).forEach(([slug, value]) => {
      const normalized = value.trim();
      if (normalized) {
        params.set(`attr_${slug}`, normalized);
      }
    });

    return params.toString();
  }

  function pushFilters(nextSort = sort, closeMobile = false) {
    const query = createQuery(nextSort);
    router.push(`/${locale}/catalog${query ? `?${query}` : ""}`);

    if (closeMobile) {
      setIsMobileOpen(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    closeMobile = false,
  ) {
    event.preventDefault();
    pushFilters(sort, closeMobile);
  }

  function handleSortChange(nextSort: CatalogFilters["sort"]) {
    setSort(nextSort);
    pushFilters(nextSort);
  }

  const formProps = {
    locale,
    dictionary,
    copy,
    categoryTree,
    brands,
    attributeFilters,
    q,
    setQ,
    category,
    setCategory,
    brand,
    setBrand,
    attributeValues,
    setAttributeValues,
    availability,
    setAvailability,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    saleOnly,
    setSaleOnly,
    minRating,
    setMinRating,
    sort,
    setSort,
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-3 shadow-sm lg:hidden">
        <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <div className="grid gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <SlidersHorizontal className="size-4 text-primary" />
                {dictionary.catalog.filters}
              </span>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-between"
                >
                  <span>{copy.editFilters}</span>
                  {activeFilterCount > 0 ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
            </div>
            <SheetContent
              side="bottom"
              className="max-h-[82vh] overflow-y-auto rounded-t-lg p-5"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="size-5 text-primary" />
                  {dictionary.catalog.filters}
                </SheetTitle>
                {filterContext ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {filterContext}
                  </p>
                ) : null}
              </SheetHeader>
              <FilterForm
                {...formProps}
                className="pb-2"
                onSubmit={(event) => handleSubmit(event, true)}
              />
            </SheetContent>
          </Sheet>
          <SortControl
            locale={locale}
            dictionary={dictionary}
            copy={copy}
            value={sort}
            onChange={handleSortChange}
          />
        </div>
        {activeFilterCount > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {activeFilterCount} {copy.activeFilters}
            </span>
            <Link
              href={`/${locale}/catalog`}
              className="font-semibold text-primary hover:underline"
            >
              {copy.reset}
            </Link>
          </div>
        ) : null}
      </div>
      <aside className="hidden rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-32 lg:block lg:self-start">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {dictionary.catalog.filters}
            </h2>
          </div>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </div>
        {filterContext ? (
          <p className="mb-5 rounded-lg bg-background px-3 py-2 text-xs font-semibold leading-5 text-muted-foreground">
            {filterContext}
          </p>
        ) : null}
        <FilterForm {...formProps} onSubmit={handleSubmit} />
      </aside>
    </>
  );
}

function FilterForm({
  locale,
  dictionary,
  copy,
  categoryTree,
  brands,
  attributeFilters,
  q,
  setQ,
  category,
  setCategory,
  brand,
  setBrand,
  attributeValues,
  setAttributeValues,
  availability,
  setAvailability,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  saleOnly,
  setSaleOnly,
  minRating,
  setMinRating,
  sort,
  setSort,
  onSubmit,
  className,
}: {
  locale: Locale;
  dictionary: Dictionary;
  copy: FilterCopy;
  categoryTree: CategoryTreeNode[];
  brands: string[];
  attributeFilters: AttributeFilter[];
  q: string;
  setQ: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  attributeValues: Record<string, string>;
  setAttributeValues: Dispatch<SetStateAction<Record<string, string>>>;
  availability: string;
  setAvailability: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  saleOnly: boolean;
  setSaleOnly: (value: boolean) => void;
  minRating: string;
  setMinRating: (value: string) => void;
  sort: CatalogFilters["sort"];
  setSort: (value: CatalogFilters["sort"]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
}) {
  return (
    <form className={cn("grid gap-5", className)} onSubmit={onSubmit}>
      <FieldGroup>
        <TextInputField
          label={dictionary.actions.search}
          value={q}
          onChange={setQ}
          placeholder={dictionary.actions.search}
        />
        <CategoryPicker
          locale={locale}
          dictionary={dictionary}
          categoryTree={categoryTree}
          value={category}
          onChange={setCategory}
        />
        <SelectField
          label={dictionary.catalog.brand}
          value={brand}
          onChange={setBrand}
        >
          <option value="">{dictionary.catalog.allBrands}</option>
          {brands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      </FieldGroup>

      <FieldGroup>
        <SelectField
          label={dictionary.catalog.availability}
          value={availability}
          onChange={setAvailability}
        >
          <option value="">{dictionary.catalog.allAvailability}</option>
          <option value="in-stock">{dictionary.common.inStock}</option>
          <option value="out-of-stock">{dictionary.catalog.outOfStock}</option>
        </SelectField>
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
          {copy.saleOnly}
          <input
            type="checkbox"
            checked={saleOnly}
            onChange={(event) => setSaleOnly(event.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
        </label>
        <SelectField
          label={copy.rating}
          value={minRating}
          onChange={setMinRating}
        >
          <option value="">{copy.anyRating}</option>
          {[5, 4, 3].map((rating) => (
            <option key={rating} value={rating}>
              {rating}+ {copy.starsUp}
            </option>
          ))}
        </SelectField>
      </FieldGroup>

      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <TextInputField
            label={dictionary.catalog.priceFrom}
            type="number"
            min="0"
            value={minPrice}
            onChange={setMinPrice}
            placeholder="0"
          />
          <TextInputField
            label={dictionary.catalog.priceTo}
            type="number"
            min="0"
            value={maxPrice}
            onChange={setMaxPrice}
            placeholder="1000"
          />
        </div>
        <SortControl
          locale={locale}
          dictionary={dictionary}
          copy={copy}
          value={sort}
          onChange={setSort}
          embedded
        />
      </FieldGroup>

      {attributeFilters.length > 0 ? (
        <FieldGroup>
          {attributeFilters.map(({ definition, options }) => (
            <SelectField
              key={definition.id}
              label={getAttributeName(definition, locale)}
              value={attributeValues[definition.slug] ?? ""}
              onChange={(value) =>
                setAttributeValues((currentValues) => ({
                  ...currentValues,
                  [definition.slug]: value,
                }))
              }
            >
              <option value="">{dictionary.catalog.allAttributeValues}</option>
              {options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
          ))}
        </FieldGroup>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Button type="submit">{dictionary.common.apply}</Button>
        <Button asChild variant="outline">
          <Link href={`/${locale}/catalog`}>{dictionary.catalog.resetFilters}</Link>
        </Button>
      </div>
    </form>
  );
}

function SortControl({
  dictionary,
  copy,
  value,
  onChange,
  embedded = false,
}: {
  locale: Locale;
  dictionary: Dictionary;
  copy: FilterCopy;
  value: CatalogFilters["sort"];
  onChange: (value: CatalogFilters["sort"]) => void;
  embedded?: boolean;
}) {
  return (
    <label
      className={cn(
        "grid gap-2 text-sm font-semibold text-foreground",
        !embedded && "min-w-0",
      )}
    >
      <span className="inline-flex items-center gap-2">
        <ArrowUpDown className="size-4 text-primary" />
        {embedded ? dictionary.catalog.sort : copy.quickSort}
      </span>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as CatalogFilters["sort"])
        }
        className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="newest">{dictionary.catalog.newest}</option>
        <option value="popular">{dictionary.catalog.popular}</option>
        <option value="rating">{copy.sortRating}</option>
        <option value="price-asc">{dictionary.catalog.priceLowHigh}</option>
        <option value="price-desc">{dictionary.catalog.priceHighLow}</option>
      </select>
    </label>
  );
}

function CategoryPicker({
  locale,
  dictionary,
  categoryTree,
  value,
  onChange,
}: {
  locale: Locale;
  dictionary: Dictionary;
  categoryTree: CategoryTreeNode[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const normalizedSearch = normalizeCategorySearch(search);
  const filteredTree = categoryTree
    .map((category) => {
      const categoryMatch = matchesCategorySearch(
        category,
        locale,
        normalizedSearch,
      );
      const children = category.children.filter((child) =>
        matchesCategorySearch(child, locale, normalizedSearch),
      );

      return {
        category,
        children,
        isVisible: !normalizedSearch || categoryMatch || children.length > 0,
      };
    })
    .filter((item) => item.isVisible);

  return (
    <div className="grid gap-3">
      <TextInputField
        label={dictionary.catalog.category}
        value={search}
        onChange={setSearch}
        placeholder={
          locale === "uk"
            ? "Пошук категорії або підкатегорії"
            : "Поиск категории или подкатегории"
        }
      />
      <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-2">
        <CategoryOptionButton
          label={dictionary.catalog.allCategories}
          selected={!value}
          onClick={() => onChange("")}
        />
        {filteredTree.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {filteredTree.map(({ category, children }) => (
              <div key={category.id} className="rounded-lg border border-border p-2">
                <CategoryOptionButton
                  label={getCategoryName(category, locale)}
                  selected={value === category.slug}
                  onClick={() => onChange(category.slug)}
                  kind={locale === "uk" ? "Категорія" : "Категория"}
                />
                {children.length > 0 ? (
                  <div className="mt-2 grid gap-1 border-l border-border pl-2">
                    {children.map((child) => (
                      <CategoryOptionButton
                        key={child.id}
                        label={getCategoryName(child, locale)}
                        selected={value === child.slug}
                        onClick={() => onChange(child.slug)}
                        kind={
                          locale === "uk" ? "Підкатегорія" : "Подкатегория"
                        }
                        compact
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            {dictionary.catalog.noResults}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryOptionButton({
  label,
  selected,
  onClick,
  kind,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  kind?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full gap-1 rounded-lg px-3 text-left transition-colors hover:bg-muted",
        compact ? "py-2" : "py-3",
        selected ? "bg-secondary text-secondary-foreground" : "text-foreground",
      )}
    >
      {kind ? (
        <span className="text-[11px] font-bold uppercase tracking-normal text-muted-foreground">
          {kind}
        </span>
      ) : null}
      <span className="line-clamp-2 text-sm font-bold leading-5">{label}</span>
    </button>
  );
}

function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <Input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </label>
  );
}

function getActiveFilterCount(filters: CatalogFilters) {
  return [
    filters.q,
    filters.category,
    filters.brand,
    filters.availability,
    filters.minPrice,
    filters.maxPrice,
    filters.saleOnly ? "sale" : "",
    filters.minRating,
    ...Object.values(filters.attributes ?? {}),
  ].filter((value) => String(value ?? "").trim()).length;
}

function matchesCategorySearch(
  category: CategoryPreview,
  locale: Locale,
  normalizedSearch: string,
) {
  if (!normalizedSearch) {
    return true;
  }

  return normalizeCategorySearch(getCategoryName(category, locale)).includes(
    normalizedSearch,
  );
}

function normalizeCategorySearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}
