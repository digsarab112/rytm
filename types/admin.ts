export type DiscountType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  expiresAt: string;
  usageLimit?: number;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryPaymentSettings = {
  deliveryTextUk: string;
  deliveryTextRu: string;
  paymentTextUk: string;
  paymentTextRu: string;
  novaPoshtaEnabled: boolean;
  ukrposhtaEnabled: boolean;
  pickupEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  onlinePaymentEnabled: boolean;
  cardOnDeliveryEnabled: boolean;
  deliveryPrice: number;
  freeDeliveryThreshold: number;
};
