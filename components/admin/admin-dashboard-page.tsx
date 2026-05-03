"use client";

import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";

import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import {
  ADMIN_CATEGORIES_STORAGE_KEY,
  ADMIN_PRODUCTS_STORAGE_KEY,
} from "@/lib/admin/storage";
import {
  formatAdminDate,
  orderStatusLabels,
} from "@/lib/admin/order-labels";
import { ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import { formatPrice, getProductName } from "@/lib/catalog/helpers";
import { isProductPublished } from "@/lib/catalog/publication";
import type { MockOrder, MockOrderStatus } from "@/types/cart";
import type { CategoryPreview, ProductPreview } from "@/types/store";

type AdminDashboardPageProps = {
  initialProducts: ProductPreview[];
  initialCategories: CategoryPreview[];
  initialOrders: MockOrder[];
};

const quickLinks = [
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const nonRevenueStatuses: MockOrderStatus[] = ["cancelled", "returned"];

export function AdminDashboardPage({
  initialProducts,
  initialCategories,
  initialOrders,
}: AdminDashboardPageProps) {
  const [products] = useLocalStorageState(
    ADMIN_PRODUCTS_STORAGE_KEY,
    initialProducts,
  );
  const [categories] = useLocalStorageState(
    ADMIN_CATEGORIES_STORAGE_KEY,
    initialCategories,
  );
  const [orders] = useLocalStorageState<MockOrder[]>(
    ORDERS_STORAGE_KEY,
    initialOrders,
  );

  const activeProducts = products.filter(
    (product) => product.status === "active" && isProductPublished(product),
  );
  const lowStockProducts = products.filter(
    (product) => product.status === "active" && product.stock > 0 && product.stock <= 10,
  );
  const activeCategories = categories.filter((category) => category.isActive);
  const newOrders = orders.filter((order) => order.status === "new");
  const revenue = orders
    .filter((order) => !nonRevenueStatuses.includes(order.status))
    .reduce((total, order) => total + order.total, 0);
  const latestOrders = [...orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);
  const bestSellingProducts = getBestSellingProducts(products, orders);

  const stats = [
    {
      label: "Total orders",
      value: String(orders.length),
      helper: `${newOrders.length} new orders`,
      icon: ShoppingBag,
    },
    {
      label: "Revenue",
      value: `${formatPrice(revenue)} UAH`,
      helper: "Orders except cancelled and returned",
      icon: BarChart3,
    },
    {
      label: "Active products",
      value: String(activeProducts.length),
      helper: `${products.length} products in catalog`,
      icon: Package,
    },
    {
      label: "Low stock",
      value: String(lowStockProducts.length),
      helper: "Products with 10 or fewer units",
      icon: Boxes,
    },
  ];

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Operational overview for orders, revenue, products, catalog health,
          customers, coupons, and store settings.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-muted-foreground">
                {stat.label}
              </p>
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <stat.icon className="size-5" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {stat.helper}
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Latest orders</h2>
          {latestOrders.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No recent orders yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {latestOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="grid gap-2 rounded-lg border border-border bg-background p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-bold text-foreground">{order.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.customerName} - {formatAdminDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-bold text-foreground">
                      {formatPrice(order.total)} UAH
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {orderStatusLabels[order.status]}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Store snapshot</h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <SnapshotRow
              label="Active categories"
              value={String(activeCategories.length)}
            />
            <SnapshotRow
              label="Header categories"
              value={String(
                categories.filter((category) => category.showInHeader).length,
              )}
            />
            <SnapshotRow
              label="Homepage categories"
              value={String(
                categories.filter((category) => category.showOnHomepage).length,
              )}
            />
            <SnapshotRow
              label="Out of stock"
              value={String(
                products.filter((product) => product.status === "out_of_stock")
                  .length,
              )}
            />
          </dl>
        </article>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Best selling products</h2>
          {bestSellingProducts.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No sales data yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {bestSellingProducts.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <p className="font-bold text-foreground">
                      {getProductName(item.product, "uk")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.product.sku}
                    </p>
                  </div>
                  <p className="font-bold text-foreground">{item.quantity}</p>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Customers</h2>
          <div className="mt-5 flex items-center gap-4 rounded-lg bg-secondary p-4">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-card text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-3xl font-bold text-foreground">
                {new Set(orders.map((order) => order.email || order.phone)).size}
              </p>
              <p className="text-sm text-muted-foreground">Known customers</p>
            </div>
          </div>
        </article>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <item.icon className="size-5 text-primary" />
            <p className="mt-4 font-bold text-foreground">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open {item.label.toLowerCase()} workspace.
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function getBestSellingProducts(
  products: ProductPreview[],
  orders: MockOrder[],
) {
  const totals = new Map<string, number>();

  for (const order of orders) {
    if (nonRevenueStatuses.includes(order.status)) {
      continue;
    }

    for (const item of order.items) {
      totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
    }
  }

  return products
    .map((product) => ({ product, quantity: totals.get(product.id) ?? 0 }))
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold text-foreground">{value}</dd>
    </div>
  );
}
