import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Building2,
  Contact,
  Home,
  LayoutGrid,
  ListTree,
  MessageSquare,
  Package,
  PanelTop,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Truck,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "@/lib/admin/actions";
import type { AdminSession } from "@/lib/admin/auth";
import { isProductPublished } from "@/lib/catalog/publication";
import type { CategoryPreview, ProductPreview, SiteSettings } from "@/types/store";

export const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/combo-offers", label: "Combo offers", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: ListTree },
  { href: "/admin/attributes", label: "Attributes", icon: SlidersHorizontal },
  { href: "/admin/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/customers", label: "Customers", icon: Contact },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
  { href: "/admin/homepage", label: "Homepage sections", icon: PanelTop },
  { href: "/admin/menu", label: "Menu settings", icon: LayoutGrid },
  { href: "/admin/delivery-payment", label: "Delivery/payment", icon: Truck },
  { href: "/admin/seo", label: "SEO settings", icon: Search },
] as const;

type AdminShellProps = {
  children: React.ReactNode;
  session: AdminSession;
  settings: SiteSettings;
};

export function AdminShell({ children, session, settings }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-border bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:grid lg:gap-8 lg:px-6">
          <Logo
            locale="uk"
            slogan={settings.slogan.uk}
            storeName={settings.storeName}
            logoText={settings.branding?.logoText}
          />
          <form action={logoutAdmin} className="lg:hidden">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:grid lg:px-4">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-w-max items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:min-w-0"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                Admin dashboard
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as {session.email}
              </p>
            </div>
            <form action={logoutAdmin} className="hidden lg:block">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

type AdminDashboardProps = {
  products: ProductPreview[];
  categories: CategoryPreview[];
};

export function AdminDashboard({ products, categories }: AdminDashboardProps) {
  const activeProducts = products.filter(
    (product) => product.status === "active" && isProductPublished(product),
  );
  const lowStockProducts = products.filter(
    (product) => product.status === "active" && product.stock > 0 && product.stock <= 10,
  );
  const activeCategories = categories.filter((category) => category.isActive);

  const stats = [
    {
      label: "Total orders",
      value: "0",
      helper: "No orders yet",
      icon: ShoppingBag,
    },
    {
      label: "Revenue",
      value: "0 ₴",
      helper: "Calculated from completed orders",
      icon: BarChart3,
    },
    {
      label: "Active products",
      value: String(activeProducts.length),
      helper: `${products.length} products in current catalog data`,
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
          Operational overview for catalog, orders, customers, coupons, and
          store settings.
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
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Latest orders</h2>
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No recent orders yet.
          </div>
        </article>
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Store snapshot</h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <SnapshotRow label="Active categories" value={String(activeCategories.length)} />
            <SnapshotRow label="Header categories" value={String(categories.filter((category) => category.showInHeader).length)} />
            <SnapshotRow label="Homepage categories" value={String(categories.filter((category) => category.showOnHomepage).length)} />
            <SnapshotRow label="Out of stock" value={String(products.filter((product) => product.status === "out_of_stock").length)} />
          </dl>
        </article>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminNavItems.slice(1, 5).map((item) => (
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

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold text-foreground">{value}</dd>
    </div>
  );
}
