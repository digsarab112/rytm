"use server";

import { getAdminSession } from "@/lib/admin/auth";
import { sendEmailNotification } from "@/lib/integrations/email";
import { buildShipmentTtnEmail } from "@/lib/notifications/email-templates";
import type { MockOrder, Shipment } from "@/types/cart";

type ShipmentEmailResult =
  | {
      ok: true;
      status: "sent" | "simulated";
      sentAt: string;
      logEntry: string;
    }
  | { ok: false; error: string; logEntry: string };

export async function sendCustomerShipmentEmail({
  order,
  shipment,
}: {
  order: MockOrder;
  shipment: Shipment;
}): Promise<ShipmentEmailResult> {
  const session = await getAdminSession();
  const sentAt = new Date().toISOString();

  if (!session) {
    return {
      ok: false,
      error: "unauthorized",
      logEntry: `[${sentAt}] Email notification failed: unauthorized admin action.`,
    };
  }

  if (!order.email.trim() || !shipment.ttnNumber.trim()) {
    return {
      ok: false,
      error: "missing-data",
      logEntry: `[${sentAt}] Email notification failed: missing customer email or TTN.`,
    };
  }

  const template = buildShipmentTtnEmail({
    orderId: order.id,
    locale: order.locale,
    ttn: shipment.ttnNumber.trim(),
    deliveryProvider: shipment.deliveryProvider,
  });
  const result = await sendEmailNotification({
    to: order.email.trim().toLowerCase(),
    subject: template.subject,
    text: template.text,
    html: template.html,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? "email-failed",
      logEntry: `[${sentAt}] Email notification failed via ${result.provider}: ${result.error ?? "unknown error"}.`,
    };
  }

  const status = result.simulated ? "simulated" : "sent";

  return {
    ok: true,
    status,
    sentAt,
    logEntry: `[${sentAt}] Customer TTN email ${status} via ${result.provider}.`,
  };
}
