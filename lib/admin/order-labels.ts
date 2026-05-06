import type {
  DeliveryProvider,
  DeliveryStatus,
  DeliveryMethod,
  MockOrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/cart";

export const orderStatuses: MockOrderStatus[] = [
  "new",
  "confirmed",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export const orderStatusLabels: Record<MockOrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  nova_poshta: "Nova Poshta",
  ukrposhta: "Ukrposhta",
  pickup: "Pickup (legacy/internal)",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash_on_delivery: "Cash on delivery",
  monopay: "Monopay",
  online_payment: "Online payment",
  card_on_delivery: "Card on delivery",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const paymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
];

export const deliveryProviderLabels: Record<DeliveryProvider, string> = {
  nova_poshta: "Nova Poshta",
  ukrposhta: "Ukrposhta",
  pickup: "Pickup (legacy/internal)",
  other: "Other",
};

export const deliveryProviders: DeliveryProvider[] = [
  "nova_poshta",
  "ukrposhta",
  "other",
];

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ttn_received: "TTN received",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const deliveryStatuses: DeliveryStatus[] = [
  "pending",
  "preparing",
  "ttn_received",
  "shipped",
  "delivered",
  "cancelled",
];

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
