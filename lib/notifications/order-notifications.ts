import type { Locale } from "@/lib/i18n/config";
import type { DeliveryProvider } from "@/types/cart";

type ShipmentNotificationInput = {
  orderId: string;
  locale: Locale;
  ttn: string;
  deliveryProvider: DeliveryProvider;
};

const providerLabels: Record<DeliveryProvider, { uk: string; ru: string }> = {
  nova_poshta: { uk: "Нової пошти", ru: "Новой почты" },
  ukrposhta: { uk: "Укрпошти", ru: "Укрпочты" },
  pickup: { uk: "самовивозу", ru: "самовывоза" },
  other: { uk: "служби доставки", ru: "службы доставки" },
};

export function buildShipmentNotificationMessage({
  orderId,
  locale,
  ttn,
  deliveryProvider,
}: ShipmentNotificationInput) {
  if (locale === "ru") {
    const provider = providerLabels[deliveryProvider].ru;

    return `Ваш заказ №${orderId} отправлен. ТТН ${provider}: ${ttn}. Спасибо, Rytm.`;
  }

  const provider = providerLabels[deliveryProvider].uk;

  return `Ваше замовлення №${orderId} відправлено. ТТН ${provider}: ${ttn}. Дякуємо, Rytm.`;
}

export function simulateShipmentNotification(input: ShipmentNotificationInput) {
  const message = buildShipmentNotificationMessage(input);
  const sentAt = new Date().toISOString();

  return {
    status: "simulated" as const,
    sentAt,
    logEntry: `[${sentAt}] Simulated customer notification: ${message}`,
    message,
  };
}
