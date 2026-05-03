"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, PackageCheck } from "lucide-react";

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
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PRODUCTS_STORAGE_KEY,
  ADMIN_SUPPLIERS_STORAGE_KEY,
} from "@/lib/admin/storage";
import { sendCustomerShipmentEmail } from "@/lib/admin/order-notification-actions";
import {
  deliveryMethodLabels,
  deliveryProviderLabels,
  deliveryProviders,
  deliveryStatusLabels,
  deliveryStatuses,
  formatAdminDate,
  orderStatusLabels,
  orderStatuses,
  paymentMethodLabels,
  paymentStatusLabels,
  paymentStatuses,
} from "@/lib/admin/order-labels";
import { ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import { formatPrice } from "@/lib/catalog/helpers";
import { simulateShipmentNotification } from "@/lib/notifications/order-notifications";
import type {
  DeliveryProvider,
  DeliveryStatus,
  MockOrder,
  MockOrderItem,
  MockOrderStatus,
  PaymentStatus,
  Shipment,
} from "@/types/cart";
import type { ProductPreview, Supplier } from "@/types/store";

type OrdersAdminPageProps = {
  initialProducts: ProductPreview[];
  initialSuppliers: Supplier[];
  initialOrders: MockOrder[];
};

type SupplierGroup = {
  supplierId: string;
  supplierName: string;
  supplier?: Supplier;
  items: MockOrderItem[];
};

const nonRevenueStatuses: MockOrderStatus[] = ["cancelled", "returned"];

export function OrdersAdminPage({
  initialProducts,
  initialSuppliers,
  initialOrders,
}: OrdersAdminPageProps) {
  const [orders, setOrders] = useLocalStorageState<MockOrder[]>(
    ORDERS_STORAGE_KEY,
    initialOrders,
  );
  const [products] = useLocalStorageState(
    ADMIN_PRODUCTS_STORAGE_KEY,
    initialProducts,
  );
  const [suppliers] = useLocalStorageState(
    ADMIN_SUPPLIERS_STORAGE_KEY,
    initialSuppliers,
  );
  const [selectedId, setSelectedId] = useState("");
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      ),
    [orders],
  );
  const selectedOrder =
    orders.find((order) => order.id === selectedId) ?? sortedOrders[0];

  const newOrders = orders.filter((order) => order.status === "new").length;
  const revenue = orders
    .filter((order) => !nonRevenueStatuses.includes(order.status))
    .reduce((total, order) => total + order.total, 0);

  function updateOrder(orderId: string, updates: Partial<MockOrder>) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : order,
      ),
    );
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Orders"
        description="View customer orders, payment status, supplier groups, manual TTN entry, and customer notification simulation."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Total orders" value={String(orders.length)} />
        <Metric label="New orders" value={String(newOrders)} />
        <Metric label="Revenue" value={`${formatPrice(revenue)} UAH`} />
      </section>
      {orders.length === 0 ? (
        <EmptyState text="No orders yet. New checkout orders will appear here." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <AdminCard title="Order queue">
            <div className="grid gap-2">
              {sortedOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    order.id === selectedOrder?.id
                      ? "border-primary bg-secondary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">{order.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.customerName} - {formatAdminDate(order.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-foreground">
                    {formatPrice(order.total)} UAH
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(order.paymentStatus ?? "pending").toUpperCase()} -{" "}
                    {paymentMethodLabels[order.paymentMethod]}
                  </p>
                </button>
              ))}
            </div>
          </AdminCard>
          {selectedOrder ? (
            <OrderDetails
              order={selectedOrder}
              products={products}
              suppliers={suppliers}
              onOrderChange={(updates) => updateOrder(selectedOrder.id, updates)}
              runAction={runAction}
              isPending={isPending}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <PackageCheck className="size-5" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold text-foreground">{value}</p>
    </article>
  );
}

function OrderDetails({
  order,
  products,
  suppliers,
  onOrderChange,
  runAction,
  isPending,
}: {
  order: MockOrder;
  products: ProductPreview[];
  suppliers: Supplier[];
  onOrderChange: (updates: Partial<MockOrder>) => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  const supplierGroups = getSupplierGroups(order, products, suppliers);
  const shipments = getOrderShipments(order, supplierGroups);
  const paymentStatus = order.paymentStatus ?? "pending";

  function updateOrderStatus(status: MockOrderStatus) {
    runAction(
      `order-status-${order.id}`,
      () => onOrderChange({ status }),
      "Order status updated.",
    );
  }

  function updatePaymentStatus(paymentStatusUpdate: PaymentStatus) {
    runAction(
      `payment-status-${order.id}`,
      () =>
        onOrderChange({
          paymentStatus: paymentStatusUpdate,
          paidAt:
            paymentStatusUpdate === "paid"
              ? order.paidAt ?? new Date().toISOString()
              : order.paidAt,
        }),
      "Payment status updated.",
    );
  }

  function updateShipment(shipmentId: string, updates: Partial<Shipment>) {
    onOrderChange({
      shipments: shipments.map((shipment) =>
        shipment.id === shipmentId
          ? {
              ...shipment,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : shipment,
      ),
    });
  }

  async function sendNotification(shipment: Shipment) {
    if (!shipment.ttnNumber.trim()) {
      updateShipment(shipment.id, {
        notificationStatus: "failed",
        customerNotificationStatus: "failed",
        notificationLog: [
          ...shipment.notificationLog,
          `[${new Date().toISOString()}] Notification failed: TTN is empty.`,
        ],
      });
      return false;
    }

    const emailResult = await sendCustomerShipmentEmail({ order, shipment });

    if (!emailResult.ok) {
      updateShipment(shipment.id, {
        notificationStatus: "failed",
        customerNotificationStatus: "failed",
        notificationLog: [...shipment.notificationLog, emailResult.logEntry],
      });
      return false;
    }

    const notification = simulateShipmentNotification({
      orderId: order.id,
      locale: order.locale,
      ttn: shipment.ttnNumber,
      deliveryProvider: shipment.deliveryProvider,
    });

    updateShipment(shipment.id, {
      notificationStatus: emailResult.status,
      notificationSentAt: emailResult.sentAt,
      customerNotificationStatus: emailResult.status,
      customerNotificationSentAt: emailResult.sentAt,
      notificationLog: [
        ...shipment.notificationLog,
        notification.logEntry,
        emailResult.logEntry,
      ],
    });
    return true;
  }

  return (
    <AdminCard
      title={`Order ${order.id}`}
      description={`Created ${formatAdminDate(order.createdAt)}. Updated ${formatAdminDate(order.updatedAt)}.`}
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Order status"
            value={order.status}
            onChange={(status) => updateOrderStatus(status as MockOrderStatus)}
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Payment status"
            value={paymentStatus}
            onChange={(status) => updatePaymentStatus(status as PaymentStatus)}
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {paymentStatusLabels[status]}
              </option>
            ))}
          </SelectField>
        </section>
        {supplierGroups.length > 1 ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-background p-4 text-sm text-primary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-bold">Multi-supplier order</p>
              <p className="mt-1 leading-6">
                This order contains products from multiple suppliers and may
                require multiple TTNs.
              </p>
            </div>
          </div>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Customer">
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Phone" value={order.phone} />
            <InfoRow label="Email" value={order.email} />
          </InfoCard>
          <InfoCard title="Delivery and payment">
            <InfoRow label="City" value={order.city} />
            <InfoRow label="Branch" value={order.novaPoshtaBranch} />
            <InfoRow
              label="Delivery"
              value={deliveryMethodLabels[order.deliveryMethod]}
            />
            <InfoRow
              label="Payment method"
              value={paymentMethodLabels[order.paymentMethod]}
            />
            <InfoRow
              label="Payment provider"
              value={order.paymentProvider ?? "manual"}
            />
            <InfoRow label="Payment status" value={paymentStatusLabels[paymentStatus]} />
            <InfoRow label="Payment ID" value={order.paymentId || "Not set"} />
            <InfoRow
              label="Paid at"
              value={order.paidAt ? formatAdminDate(order.paidAt) : "Not paid"}
            />
          </InfoCard>
        </section>
        <InfoCard title="Supplier fulfillment">
          <div className="grid gap-4">
            {supplierGroups.map((group) => {
              const shipment = shipments.find(
                (item) => item.supplierId === group.supplierId,
              );

              if (!shipment) {
                return null;
              }

              return (
                <div
                  key={group.supplierId}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {group.supplierName}
                        </h3>
                        {!group.supplier ? (
                          <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary">
                            Supplier missing
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 grid gap-2 text-sm">
                        <InfoRow
                          label="Contact"
                          value={group.supplier?.contactName || "Not assigned"}
                        />
                        <InfoRow
                          label="Phone"
                          value={group.supplier?.phone || "Not assigned"}
                        />
                        <InfoRow
                          label="Email"
                          value={group.supplier?.email || "Not assigned"}
                        />
                        <InfoRow
                          label="Warehouse"
                          value={
                            group.supplier?.novaPoshtaWarehouse ||
                            "Not assigned"
                          }
                        />
                      </div>
                      <div className="mt-4 grid gap-3">
                        {group.items.map((item) => (
                          <div
                            key={`${item.productId}-${item.variantId ?? "base"}-${item.sku}`}
                            className="grid gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <p className="font-bold text-foreground">
                                {item.nameUk}
                              </p>
                              {item.variantLabelUk ? (
                                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                  {item.variantLabelUk}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-muted-foreground">
                                {(item.variantSku || item.sku)} - {item.quantity} x{" "}
                                {formatPrice(item.price)} UAH
                              </p>
                            </div>
                            <p className="font-bold text-foreground">
                              {formatPrice(item.lineTotal)} UAH
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid content-start gap-4">
                      <SelectField
                        label="Delivery provider"
                        value={shipment.deliveryProvider}
                        onChange={(deliveryProvider) =>
                          runAction(
                            `provider-${shipment.id}`,
                            () =>
                              updateShipment(shipment.id, {
                                deliveryProvider:
                                  deliveryProvider as DeliveryProvider,
                              }),
                            "Delivery provider updated.",
                          )
                        }
                      >
                        {deliveryProviders.map((provider) => (
                          <option key={provider} value={provider}>
                            {deliveryProviderLabels[provider]}
                          </option>
                        ))}
                      </SelectField>
                      <TextField
                        label="TTN number"
                        value={shipment.ttnNumber}
                        onChange={(ttnNumber) =>
                          updateShipment(shipment.id, {
                            ttnNumber,
                            ttnCreatedAt: ttnNumber
                              ? shipment.ttnCreatedAt ??
                                new Date().toISOString()
                              : undefined,
                          })
                        }
                      />
                      <SelectField
                        label="Delivery status"
                        value={shipment.deliveryStatus}
                        onChange={(deliveryStatus) =>
                          runAction(
                            `delivery-status-${shipment.id}`,
                            () =>
                              updateShipment(shipment.id, {
                                deliveryStatus: deliveryStatus as DeliveryStatus,
                              }),
                            "Delivery status updated.",
                          )
                        }
                      >
                        {deliveryStatuses.map((status) => (
                          <option key={status} value={status}>
                            {deliveryStatusLabels[status]}
                          </option>
                        ))}
                      </SelectField>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending(`ttn-${shipment.id}`)}
                        onClick={() =>
                          runAction(
                            `ttn-${shipment.id}`,
                            () =>
                              updateShipment(shipment.id, {
                                ttnCreatedAt:
                                  shipment.ttnNumber.trim() &&
                                  !shipment.ttnCreatedAt
                                    ? new Date().toISOString()
                                    : shipment.ttnCreatedAt,
                              }),
                            "TTN saved.",
                          )
                        }
                      >
                        {isPending(`ttn-${shipment.id}`) ? "Saving..." : "Save TTN"}
                      </Button>
                      <Button
                        type="button"
                        disabled={isPending(`notify-${shipment.id}`)}
                        onClick={() =>
                          runAction(
                            `notify-${shipment.id}`,
                            async () => {
                              if (!(await sendNotification(shipment))) {
                                throw new Error("TTN is required.");
                              }
                            },
                            "Customer notification sent.",
                            "Enter a TTN and email before sending a notification.",
                          )
                        }
                      >
                        <Bell />
                        {isPending(`notify-${shipment.id}`)
                          ? "Sending..."
                          : "Send customer notification"}
                      </Button>
                      <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">
                          Notification:{" "}
                          {shipment.customerNotificationStatus ??
                            shipment.notificationStatus}
                        </p>
                        {shipment.notificationLog.length > 0 ? (
                          <div className="mt-3 grid gap-2">
                            {shipment.notificationLog.map((entry) => (
                              <p key={entry}>{entry}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2">No notification log yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </InfoCard>
        <InfoCard title="Totals">
          <InfoRow label="Subtotal" value={`${formatPrice(order.subtotal)} UAH`} />
          {order.discountTotal && order.discountTotal > 0 ? (
            <InfoRow
              label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
              value={`-${formatPrice(order.discountTotal)} UAH`}
            />
          ) : null}
          <InfoRow
            label="Delivery"
            value={`${formatPrice(order.deliveryPrice)} UAH`}
          />
          <InfoRow label="Total" value={`${formatPrice(order.total)} UAH`} />
          <InfoRow label="Comment" value={order.comment || "No comment"} />
        </InfoCard>
      </div>
    </AdminCard>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/30 p-4">
      <h3 className="font-bold text-foreground">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function getSupplierGroups(
  order: MockOrder,
  products: ProductPreview[],
  suppliers: Supplier[],
): SupplierGroup[] {
  const groups = new Map<string, SupplierGroup>();

  order.items.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const supplierId = item.supplierId || product?.supplierId || "unassigned";
    const supplier = suppliers.find((candidate) => candidate.id === supplierId);
    const supplierName =
      item.supplierName ||
      product?.supplierName ||
      supplier?.name ||
      "Unassigned supplier";
    const existingGroup = groups.get(supplierId);

    if (existingGroup) {
      existingGroup.items.push(item);
      return;
    }

    groups.set(supplierId, {
      supplierId,
      supplierName,
      supplier,
      items: [item],
    });
  });

  return Array.from(groups.values());
}

function getOrderShipments(order: MockOrder, supplierGroups: SupplierGroup[]) {
  const existingShipments = Array.isArray(order.shipments) ? order.shipments : [];

  return supplierGroups.map((group) => {
    const existingShipment = existingShipments.find(
      (shipment) => shipment.supplierId === group.supplierId,
    );

    return (
      existingShipment ??
      createShipment(order, group.supplierId, order.deliveryMethod)
    );
  });
}

function createShipment(
  order: MockOrder,
  supplierId: string,
  deliveryProvider: DeliveryProvider,
): Shipment {
  const now = new Date().toISOString();

  return {
    id: `${order.id}-${supplierId}`,
    orderId: order.id,
    supplierId,
    deliveryProvider,
    ttnNumber: "",
    deliveryStatus: "pending",
    notificationStatus: "not_sent",
    customerNotificationStatus: "not_sent",
    notificationLog: [],
    createdAt: order.createdAt || now,
    updatedAt: now,
  };
}
