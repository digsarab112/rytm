import { deliveryInfo } from "@/lib/mock/store";
import type { DeliveryPaymentSettings } from "@/types/admin";
import type { DeliveryInfoItem } from "@/types/store";

function formatDeliveryItems(
  items: DeliveryInfoItem[],
  locale: "uk" | "ru",
) {
  return items
    .map((item) => `${item.title[locale]}: ${item.text[locale]}`)
    .join("\n\n");
}

export function getDefaultDeliveryPaymentSettings(): DeliveryPaymentSettings {
  const paymentItems = deliveryInfo.filter((item) => item.id === "payment");
  const deliveryItems = deliveryInfo.filter((item) => item.id !== "payment");
  const onlinePaymentText = {
    uk: "Онлайн-оплата: оплачуйте замовлення під час оформлення.",
    ru: "Онлайн-оплата: оплачивайте заказ во время оформления.",
  };

  return {
    deliveryTextUk: formatDeliveryItems(deliveryItems, "uk"),
    deliveryTextRu: formatDeliveryItems(deliveryItems, "ru"),
    paymentTextUk: [onlinePaymentText.uk, formatDeliveryItems(paymentItems, "uk")]
      .filter(Boolean)
      .join("\n\n"),
    paymentTextRu: [onlinePaymentText.ru, formatDeliveryItems(paymentItems, "ru")]
      .filter(Boolean)
      .join("\n\n"),
    novaPoshtaEnabled: true,
    ukrposhtaEnabled: true,
    pickupEnabled: false,
    cashOnDeliveryEnabled: true,
    onlinePaymentEnabled: true,
    cardOnDeliveryEnabled: false,
    deliveryPrice: 80,
    freeDeliveryThreshold: 1500,
  };
}
