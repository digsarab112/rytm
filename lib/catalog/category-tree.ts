import type { CategoryPreview } from "@/types/store";

export type CategoryTreeNode = CategoryPreview & {
  children: CategoryTreeNode[];
  depth: number;
};

export function sortCategories(categories: CategoryPreview[]) {
  return [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.nameUk.localeCompare(b.nameUk),
  );
}

export function isCatalogNavigationVisible(category: CategoryPreview) {
  return category.showInCatalogNavigation ?? true;
}

export function buildCategoryTree(
  categories: CategoryPreview[],
  options: {
    activeOnly?: boolean;
    headerOnly?: boolean;
    homepageOnly?: boolean;
    catalogNavigationOnly?: boolean;
  } = {},
) {
  const filteredCategories = sortCategories(categories).filter((category) => {
    if (options.activeOnly && !category.isActive) {
      return false;
    }

    if (options.headerOnly && !category.showInHeader) {
      return false;
    }

    if (options.homepageOnly && !category.showOnHomepage) {
      return false;
    }

    if (options.catalogNavigationOnly && !isCatalogNavigationVisible(category)) {
      return false;
    }

    return true;
  });
  const nodeMap = new Map<string, CategoryTreeNode>();

  filteredCategories.forEach((category) => {
    nodeMap.set(category.id, { ...category, children: [], depth: 0 });
  });

  const roots: CategoryTreeNode[] = [];

  filteredCategories.forEach((category) => {
    const node = nodeMap.get(category.id);

    if (!node) {
      return;
    }

    const parent =
      category.parentId && category.parentId !== category.id
        ? nodeMap.get(category.parentId)
        : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  function assignDepth(node: CategoryTreeNode, depth: number) {
    node.depth = depth;
    node.children.forEach((child) => assignDepth(child, depth + 1));
  }

  roots.forEach((node) => assignDepth(node, 0));

  return roots;
}

export function flattenCategoryTree(nodes: CategoryTreeNode[]) {
  const flattened: CategoryTreeNode[] = [];

  function visit(node: CategoryTreeNode) {
    flattened.push(node);
    node.children.forEach(visit);
  }

  nodes.forEach(visit);
  return flattened;
}

export function getCategoryDepth(
  categories: CategoryPreview[],
  categoryId: string,
) {
  let depth = 0;
  let current = categories.find((category) => category.id === categoryId);
  const visited = new Set<string>();

  while (current?.parentId && !visited.has(current.parentId)) {
    visited.add(current.id);
    const parent = categories.find((category) => category.id === current?.parentId);

    if (!parent) {
      break;
    }

    depth += 1;
    current = parent;
  }

  return depth;
}

export function getCategoryAndDescendantIds(
  categories: CategoryPreview[],
  categoryId: string,
) {
  const ids = new Set<string>([categoryId]);
  let didAdd = true;

  while (didAdd) {
    didAdd = false;

    categories.forEach((category) => {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        didAdd = true;
      }
    });
  }

  return Array.from(ids);
}

export function wouldCreateCategoryCycle(
  categories: CategoryPreview[],
  categoryId: string,
  parentId?: string,
) {
  if (!parentId || parentId === categoryId) {
    return Boolean(parentId);
  }

  return getCategoryAndDescendantIds(categories, categoryId).includes(parentId);
}
