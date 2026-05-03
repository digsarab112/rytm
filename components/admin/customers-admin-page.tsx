"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Mail,
  Phone,
  ReceiptText,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { orderStatusLabels, formatAdminDate } from "@/lib/admin/order-labels";
import { ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import { formatPrice } from "@/lib/catalog/helpers";
import { CUSTOMER_ACCOUNTS_STORAGE_KEY } from "@/lib/customer/storage";
import { cn } from "@/lib/utils";
import type { MockOrder, MockOrderStatus } from "@/types/cart";
import type { CustomerAccount } from "@/types/customer";

type CustomerInsight = {
  id: string;
  name: string;
  phone: string;
  email: string;
  registeredAt: string;
  orderCount: number;
  purchaseCount: number;
  totalSpent: number;
  averageOrderValue: number;
  latestOrder?: string;
  orders: MockOrder[];
};

const nonRevenueStatuses: MockOrderStatus[] = ["cancelled", "returned"];

export function CustomersAdminPage({
  initialCustomers = [],
  initialOrders = [],
}: {
  initialCustomers?: CustomerAccount[];
  initialOrders?: MockOrder[];
}) {
  const [registeredCustomers] = useLocalStorageState<CustomerAccount[]>(
    CUSTOMER_ACCOUNTS_STORAGE_KEY,
    initialCustomers,
  );
  const [orders] = useLocalStorageState<MockOrder[]>(
    ORDERS_STORAGE_KEY,
    initialOrders,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const customers = useMemo(
    () => buildCustomerInsights(registeredCustomers, orders),
    [registeredCustomers, orders],
  );
  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ??
    customers[0];
  const buyerCount = customers.filter((customer) => customer.purchaseCount > 0).length;
  const repeatBuyerCount = customers.filter(
    (customer) => customer.purchaseCount > 1,
  ).length;
  const totalRevenue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0,
  );

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Customers"
        description="See registered customers, who purchased, repeat buyers, and each customer's order history."
      />
      <section className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Registered"
          value={String(customers.length)}
          icon={UserRound}
        />
        <Metric label="Buyers" value={String(buyerCount)} icon={ShoppingBag} />
        <Metric
          label="Repeat buyers"
          value={String(repeatBuyerCount)}
          icon={ReceiptText}
        />
        <Metric
          label="Revenue"
          value={`${formatPrice(totalRevenue)} UAH`}
          icon={ShoppingBag}
        />
      </section>
      {customers.length === 0 ? (
        <AdminCard title="Registered customers">
          <EmptyState text="No registered customers yet. Customer accounts will appear here after registration or checkout." />
        </AdminCard>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_1.4fr]">
          <AdminCard
            title="Registered customers"
            description="Click a customer to review purchase activity."
          >
            <div className="grid max-h-[680px] gap-3 overflow-y-auto pr-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={cn(
                    "rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted",
                    selectedCustomer?.id === customer.id &&
                      "border-primary bg-secondary/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-foreground">
                        {customer.name || customer.email}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-card px-3 py-1 text-xs font-bold text-primary">
                      {customer.purchaseCount} orders
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{formatPrice(customer.totalSpent)} UAH</span>
                    <span className="text-right">
                      {customer.latestOrder
                        ? formatAdminDate(customer.latestOrder)
                        : "No orders"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </AdminCard>
          {selectedCustomer ? (
            <CustomerDetail customer={selectedCustomer} />
          ) : null}
        </section>
      )}
    </div>
  );
}

function CustomerDetail({ customer }: { customer: CustomerInsight }) {
  return (
    <AdminCard title={customer.name || customer.email}>
      <section className="grid gap-4 md:grid-cols-3">
        <SmallMetric label="Purchases" value={String(customer.purchaseCount)} />
        <SmallMetric
          label="Total spent"
          value={`${formatPrice(customer.totalSpent)} UAH`}
        />
        <SmallMetric
          label="Average order"
          value={`${formatPrice(customer.averageOrderValue)} UAH`}
        />
      </section>
      <section className="mt-6 grid gap-3 rounded-lg border border-border bg-background p-4 text-sm">
        <InfoRow icon={Mail} label="Email" value={customer.email || "-"} />
        <InfoRow icon={Phone} label="Phone" value={customer.phone || "-"} />
        <InfoRow
          icon={CalendarDays}
          label="Registered"
          value={formatAdminDate(customer.registeredAt)}
        />
        <InfoRow
          icon={ReceiptText}
          label="Latest order"
          value={customer.latestOrder ? formatAdminDate(customer.latestOrder) : "-"}
        />
      </section>
      <section className="mt-6">
        <h3 className="text-base font-bold text-foreground">Order history</h3>
        {customer.orders.length === 0 ? (
          <div className="mt-4">
            <EmptyState text="This customer has not purchased yet." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="py-3 pl-4 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-b-0">
                    <td className="py-4 pr-4 font-bold text-foreground">
                      {order.id}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatAdminDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {orderStatusLabels[order.status]}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {order.items.reduce((total, item) => total + item.quantity, 0)}
                    </td>
                    <td className="py-4 pl-4 text-right font-semibold text-foreground">
                      {formatPrice(order.total)} UAH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminCard>
  );
}

function buildCustomerInsights(
  registeredCustomers: CustomerAccount[],
  orders: MockOrder[],
) {
  const ordersByEmail = new Map<string, MockOrder[]>();

  for (const order of orders) {
    const email = normalizeEmail(order.email);

    if (!email) {
      continue;
    }

    ordersByEmail.set(email, [...(ordersByEmail.get(email) ?? []), order]);
  }

  return registeredCustomers
    .map((customer) => {
      const customerOrders = (ordersByEmail.get(normalizeEmail(customer.email)) ?? [])
        .slice()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      const revenueOrders = customerOrders.filter(
        (order) => !nonRevenueStatuses.includes(order.status),
      );
      const totalSpent = revenueOrders.reduce(
        (total, order) => total + order.total,
        0,
      );
      const latestOrder = customerOrders[0];

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: latestOrder?.phone ?? "",
        registeredAt: customer.createdAt,
        orderCount: customerOrders.length,
        purchaseCount: revenueOrders.length,
        totalSpent,
        averageOrderValue:
          revenueOrders.length > 0 ? totalSpent / revenueOrders.length : 0,
        latestOrder: latestOrder?.createdAt,
        orders: customerOrders,
      };
    })
    .sort(
      (a, b) =>
        Number(b.purchaseCount > 0) - Number(a.purchaseCount > 0) ||
        Date.parse(b.latestOrder ?? b.registeredAt) -
          Date.parse(a.latestOrder ?? a.registeredAt),
    );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ShoppingBag;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold text-foreground">{value}</p>
    </article>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-xl font-bold text-foreground">{value}</p>
    </article>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <dt className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-bold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
