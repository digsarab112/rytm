"use server";

import { revalidatePath } from "next/cache";

import { PaymentProvider, PaymentStatus } from "@/lib/generated/prisma/client";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";
import { createMonopayCheckout } from "@/lib/integrations/payments/monopay";
import { sendEmailNotification } from "@/lib/integrations/email";
import { buildOrderConfirmationEmail } from "@/lib/notifications/email-templates";
import { upsertOrder } from "@/lib/platform/storefront-database";
import type { MockOrder } from "@/types/cart";
import type { CustomerSession } from "@/types/customer";

export async function createCheckoutOrder({
  order,
  session,
}: {
  order: MockOrder;
  session?: CustomerSession | null;
}) {
  if (!isDatabaseConfigured()) {
    return {
      ok: false as const,
      order,
      error: "database-not-configured" as const,
    };
  }

  let savedOrder: MockOrder;
  let payment: Awaited<ReturnType<typeof maybeCreateMonopayInvoice>>;

  try {
    const customerId = await upsertCheckoutCustomer(order, session);
    savedOrder = await upsertOrder(order, customerId);
    payment = await maybeCreateMonopayInvoice(savedOrder);
  } catch (error) {
    console.error("Checkout order save failed", error);
    return { ok: false as const, order, error: "save-failed" as const };
  }

  try {
    await sendOrderConfirmationEmail(savedOrder);
  } catch (error) {
    console.error("Checkout confirmation email failed", error);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/orders");
  revalidatePath("/account");

  return { ok: true as const, order: savedOrder, payment };
}

async function sendOrderConfirmationEmail(order: MockOrder) {
  if (!order.email.trim()) {
    return;
  }

  const template = buildOrderConfirmationEmail(order);
  await sendEmailNotification({
    to: order.email.trim().toLowerCase(),
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

export async function getCheckoutOrder(orderId: string) {
  if (!isDatabaseConfigured()) {
    return { ok: false as const };
  }

  const order = await getPrismaClient().order.findUnique({
    where: { publicId: orderId },
    include: {
      items: true,
      shipments: true,
      paymentTransactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    order: {
      id: order.publicId,
      customerName: order.customerName ?? "",
      phone: order.customerPhone ?? "",
      email: order.customerEmail ?? "",
      city: order.city ?? "",
      novaPoshtaBranch: order.warehouse ?? "",
      deliveryMethod: (order.deliveryMethod ?? "nova_poshta") as
        | "nova_poshta"
        | "ukrposhta"
        | "pickup",
      paymentMethod: (order.paymentMethod ?? "cash_on_delivery") as
        | "cash_on_delivery"
        | "monopay"
        | "online_payment"
        | "card_on_delivery",
      paymentProvider:
        order.paymentProvider === "MONOPAY"
          ? ("monopay" as const)
          : ("manual" as const),
      paymentStatus:
        order.paymentStatus === "PAID"
          ? ("paid" as const)
          : ("pending" as const),
      status: order.status === "COMPLETED" ? ("delivered" as const) : ("new" as const),
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      couponCode: order.couponCode ?? undefined,
      deliveryPrice: Number(order.deliveryFee),
      total: Number(order.total),
      comment: order.comment ?? "",
      items: order.items.map((item) => ({
        productId: item.productId ?? "",
        nameUk: item.productNameUk,
        nameRu: item.productNameRu,
        sku: item.sku ?? "",
        supplierId: item.supplierId ?? undefined,
        price: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      shipments: order.shipments.map((shipment) => ({
        id: shipment.id,
        orderId: order.publicId,
        supplierId: shipment.supplierId ?? "unassigned",
        deliveryProvider: (shipment.carrier || "nova_poshta") as
          | "nova_poshta"
          | "ukrposhta"
          | "pickup"
          | "other",
        ttnNumber: shipment.ttn ?? "",
        deliveryStatus: "pending" as const,
        notificationStatus: "not_sent" as const,
        customerNotificationStatus: "not_sent" as const,
        notificationLog: shipment.notes ? shipment.notes.split("\n") : [],
        createdAt: shipment.createdAt.toISOString(),
        updatedAt: shipment.updatedAt.toISOString(),
      })),
      locale: order.locale === "ru" ? ("ru" as const) : ("uk" as const),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    },
  };
}

async function upsertCheckoutCustomer(
  order: MockOrder,
  session: CustomerSession | null | undefined,
) {
  const prisma = getPrismaClient();
  const normalizedEmail = order.email.trim().toLowerCase();
  const customer = await prisma.customer.upsert({
    where: { email: normalizedEmail },
    update: {
      name: order.customerName,
      profile: {
        upsert: {
          create: {
            phone: order.phone,
            city: order.city,
            warehouse: order.novaPoshtaBranch,
          },
          update: {
            phone: order.phone,
            city: order.city,
            warehouse: order.novaPoshtaBranch,
          },
        },
      },
    },
    create: {
      id: session?.customerId,
      email: normalizedEmail,
      name: order.customerName,
      locale: order.locale,
      profile: {
        create: {
          phone: order.phone,
          city: order.city,
          warehouse: order.novaPoshtaBranch,
        },
      },
    },
  });

  return customer.id;
}

async function maybeCreateMonopayInvoice(order: MockOrder) {
  if (order.paymentMethod !== "monopay") {
    return undefined;
  }

  const transactionId = order.paymentId ?? `monopay-${order.id}`;
  const checkout = await createMonopayCheckout({
    orderId: order.id,
    amount: order.total,
    currency: order.paymentCurrency ?? "UAH",
    description: `Rytm order ${order.id}`,
    locale: order.locale,
  });

  await updateMonopayTransaction(order.id, transactionId, checkout);

  return {
    provider: checkout.provider,
    configured: checkout.configured,
    checkoutUrl: checkout.checkoutUrl,
    invoiceId: checkout.invoiceId,
    message: checkout.message,
  };
}

async function updateMonopayTransaction(
  orderId: string,
  transactionId: string,
  checkout: Awaited<ReturnType<typeof createMonopayCheckout>>,
) {
  const prisma = getPrismaClient();
  const savedOrder = await prisma.order.findUnique({
    where: { publicId: orderId },
    select: { id: true },
  });

  if (!savedOrder) {
    return;
  }

  await prisma.paymentTransaction.upsert({
    where: { id: transactionId },
    update: {
      provider: PaymentProvider.MONOPAY,
      status: PaymentStatus.PENDING,
      amount: checkout.amount,
      currency: checkout.currency,
      externalId: checkout.invoiceId ?? transactionId,
      checkoutUrl: checkout.checkoutUrl,
      rawPayload: {
        message: checkout.message,
        invoiceId: checkout.invoiceId,
        pageUrl: checkout.checkoutUrl,
      },
    },
    create: {
      id: transactionId,
      orderId: savedOrder.id,
      provider: PaymentProvider.MONOPAY,
      status: PaymentStatus.PENDING,
      amount: checkout.amount,
      currency: checkout.currency,
      externalId: checkout.invoiceId ?? transactionId,
      checkoutUrl: checkout.checkoutUrl,
      rawPayload: {
        message: checkout.message,
        invoiceId: checkout.invoiceId,
        pageUrl: checkout.checkoutUrl,
      },
    },
  });
}
