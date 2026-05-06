import type { Locale } from "@/lib/i18n/config";

export type CartItem = {
  productId: string;
  variantId?: string;
  comboOfferId?: string;
  comboSourceProductId?: string;
  comboProductIds?: string[];
  comboDiscountPercent?: number;
  quantity: number;
};

export type CartLine = CartItem & {
  name: string;
  slug: string;
  brand: string;
  sku: string;
  supplierId?: string;
  supplierName?: string;
  price: number;
  salePrice?: number;
  stock: number;
  variantLabel?: string;
  variantSku?: string;
  variantImageUrl?: string;
  comboOfferId?: string;
  comboSourceProductId?: string;
  comboProductIds?: string[];
  comboDiscountPercent?: number;
  comboDiscountAmount?: number;
  imageUrl?: string;
  tone: "rose" | "sage" | "cream" | "linen";
  lineTotal: number;
};

export type DeliveryMethod = "nova_poshta" | "ukrposhta" | "pickup";

export type PaymentMethod =
  | "cash_on_delivery"
  | "monopay"
  | "online_payment"
  | "card_on_delivery";

export type PaymentProvider =
  | "monopay"
  | "cash_on_delivery"
  | "manual"
  | "card_on_delivery";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type DeliveryProvider =
  | "nova_poshta"
  | "ukrposhta"
  | "pickup"
  | "other";

export type DeliveryStatus =
  | "pending"
  | "preparing"
  | "ttn_received"
  | "shipped"
  | "delivered"
  | "cancelled";

export type NotificationStatus =
  | "not_sent"
  | "simulated"
  | "sent"
  | "failed";

export type MockOrderStatus =
  | "new"
  | "confirmed"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type MockOrderItem = {
  productId: string;
  variantId?: string;
  nameUk: string;
  nameRu: string;
  sku: string;
  variantLabelUk?: string;
  variantLabelRu?: string;
  variantSku?: string;
  supplierId?: string;
  supplierName?: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type Shipment = {
  id: string;
  orderId: string;
  supplierId: string;
  deliveryProvider: DeliveryProvider;
  ttnNumber: string;
  deliveryStatus: DeliveryStatus;
  notificationStatus: NotificationStatus;
  notificationSentAt?: string;
  ttnCreatedAt?: string;
  customerNotificationStatus?: NotificationStatus;
  customerNotificationSentAt?: string;
  notificationLog: string[];
  createdAt: string;
  updatedAt: string;
};

export type MockOrder = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  novaPoshtaBranch: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentProvider?: PaymentProvider;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentCheckoutUrl?: string;
  paidAt?: string;
  paymentRawResponse?: string;
  status: MockOrderStatus;
  subtotal: number;
  discountTotal?: number;
  couponCode?: string;
  deliveryPrice: number;
  total: number;
  comment: string;
  items: MockOrderItem[];
  shipments?: Shipment[];
  locale: Locale;
  createdAt: string;
  updatedAt: string;
};
