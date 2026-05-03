"use server";

import { createHash, randomBytes } from "crypto";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";
import { sendEmailNotification } from "@/lib/integrations/email";
import {
  buildPasswordResetEmail,
  buildWelcomeEmail,
} from "@/lib/notifications/email-templates";
import type { Locale } from "@/lib/i18n/config";
import type { CustomerSession } from "@/types/customer";

type CustomerInput = {
  name?: string;
  email: string;
  password: string;
  locale?: Locale;
};

type CustomerAuthResult =
  | { ok: true; session: CustomerSession }
  | { ok: false; error: "exists" | "missing" | "invalid" | "weak" | "fallback" };

type PasswordResetRequestResult = { ok: true };

type PasswordResetResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "weak" | "fallback" };

export async function registerCustomerAccount({
  name = "",
  email,
  password,
  locale = "uk",
}: CustomerInput): Promise<CustomerAuthResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "fallback" };
  }

  if (password.length < 6) {
    return { ok: false, error: "weak" };
  }

  const prisma = getPrismaClient();
  const normalizedEmail = normalizeEmail(email);
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingCustomer) {
    return { ok: false, error: "exists" };
  }

  const customer = await prisma.customer.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hashCustomerPassword(password),
      locale,
      profile: {
        create: {},
      },
    },
  });

  await sendWelcomeCustomerEmail({
    email: customer.email,
    name: customer.name,
    locale,
  });

  return { ok: true, session: createSession(customer) };
}

export async function loginCustomerAccount({
  email,
  password,
}: CustomerInput): Promise<CustomerAuthResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "fallback" };
  }

  const prisma = getPrismaClient();
  const customer = await prisma.customer.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!customer?.passwordHash) {
    return { ok: false, error: "missing" };
  }

  if (customer.passwordHash !== hashCustomerPassword(password)) {
    return { ok: false, error: "invalid" };
  }

  return { ok: true, session: createSession(customer) };
}

export async function getCustomerProfileData(customerId: string, email: string) {
  if (!isDatabaseConfigured()) {
    return { ok: false as const };
  }

  const customer = await getPrismaClient().customer.findFirst({
    where: {
      OR: [{ id: customerId }, { email: normalizeEmail(email) }],
    },
    include: {
      profile: true,
      orders: {
        include: {
          items: true,
          shipments: true,
          paymentTransactions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    account: {
      id: customer.id,
      name: customer.name ?? "",
      email: customer.email,
      passwordHash: "",
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    },
    profile: {
      phone: customer.profile?.phone ?? "",
      city: customer.profile?.city ?? "",
      warehouse: customer.profile?.warehouse ?? "",
      address: customer.profile?.address ?? "",
    },
    orders: customer.orders.map((order) => ({
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
        | "liqpay"
        | "online_payment"
        | "card_on_delivery",
      paymentProvider:
        order.paymentProvider === "LIQPAY"
          ? ("liqpay" as const)
          : ("manual" as const),
      paymentStatus:
        order.paymentStatus === "PAID"
          ? ("paid" as const)
          : order.paymentStatus === "FAILED"
            ? ("failed" as const)
            : order.paymentStatus === "CANCELLED"
              ? ("cancelled" as const)
              : order.paymentStatus === "REFUNDED"
                ? ("refunded" as const)
                : ("pending" as const),
      status:
        order.status === "COMPLETED"
          ? ("delivered" as const)
          : order.status === "SHIPPED"
            ? ("shipped" as const)
            : order.status === "CANCELLED"
              ? ("cancelled" as const)
              : order.status === "REFUNDED"
                ? ("returned" as const)
                : order.status === "CONFIRMED"
                  ? ("confirmed" as const)
                  : order.status === "PROCESSING"
                    ? ("packed" as const)
                    : ("new" as const),
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      couponCode: order.couponCode ?? undefined,
      deliveryPrice: Number(order.deliveryFee),
      total: Number(order.total),
      comment: order.comment ?? "",
      items: order.items.map((item) => ({
        productId: item.productId ?? "",
        variantId: item.variantId ?? undefined,
        nameUk: item.productNameUk,
        nameRu: item.productNameRu,
        sku: item.sku ?? "",
        variantLabelUk: item.variantLabelUk ?? undefined,
        variantLabelRu: item.variantLabelRu ?? undefined,
        variantSku: item.variantSku ?? undefined,
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
        deliveryStatus:
          shipment.status === "SHIPPED"
            ? ("shipped" as const)
            : shipment.status === "DELIVERED"
              ? ("delivered" as const)
              : shipment.status === "CANCELLED"
                ? ("cancelled" as const)
                : shipment.status === "READY"
                  ? ("ttn_received" as const)
                  : ("pending" as const),
        notificationStatus: "not_sent" as const,
        customerNotificationStatus: "not_sent" as const,
        notificationLog: shipment.notes ? shipment.notes.split("\n") : [],
        createdAt: shipment.createdAt.toISOString(),
        updatedAt: shipment.updatedAt.toISOString(),
      })),
      locale: order.locale === "ru" ? ("ru" as const) : ("uk" as const),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })),
  };
}

export async function updateCustomerProfileData({
  customerId,
  email,
  name,
  phone,
  city,
  warehouse,
  address,
}: {
  customerId: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  warehouse: string;
  address?: string;
}) {
  if (!isDatabaseConfigured()) {
    return { ok: false as const };
  }

  const prisma = getPrismaClient();
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [{ id: customerId }, { email: normalizeEmail(email) }],
    },
  });

  if (!customer) {
    return { ok: false as const };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      name,
      profile: {
        upsert: {
          create: { phone, city, warehouse, address },
          update: { phone, city, warehouse, address },
        },
      },
    },
  });

  return { ok: true as const };
}

export async function requestCustomerPasswordReset({
  email,
  locale = "uk",
}: {
  email: string;
  locale?: Locale;
}): Promise<PasswordResetRequestResult> {
  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  const prisma = getPrismaClient();
  const normalizedEmail = normalizeEmail(email);
  const customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
  });

  if (!customer?.passwordHash || !customer.isActive) {
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  const expiresInMinutes = 60;
  await prisma.customerPasswordResetToken.deleteMany({
    where: {
      customerId: customer.id,
      OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }],
    },
  });
  await prisma.customerPasswordResetToken.create({
    data: {
      customerId: customer.id,
      tokenHash: hashPasswordResetToken(token),
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
  });

  const template = buildPasswordResetEmail({
    email: customer.email,
    name: customer.name,
    locale: customer.locale === "ru" ? "ru" : locale,
    resetUrl: createCustomerPasswordResetUrl(token, locale),
    expiresInMinutes,
  });
  await sendEmailNotification({
    to: customer.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });

  return { ok: true };
}

export async function resetCustomerPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}): Promise<PasswordResetResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "fallback" };
  }

  if (password.length < 6) {
    return { ok: false, error: "weak" };
  }

  const prisma = getPrismaClient();
  const resetToken = await prisma.customerPasswordResetToken.findFirst({
    where: {
      tokenHash: hashPasswordResetToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { customer: true },
  });

  if (!resetToken?.customer?.isActive) {
    return { ok: false, error: "invalid" };
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: resetToken.customerId },
      data: { passwordHash: hashCustomerPassword(password) },
    }),
    prisma.customerPasswordResetToken.updateMany({
      where: { customerId: resetToken.customerId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

function createSession(customer: { id: string; name: string | null; email: string }) {
  return {
    customerId: customer.id,
    name: customer.name ?? customer.email,
    email: customer.email,
    createdAt: new Date().toISOString(),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCustomerPassword(password: string) {
  return createHash("sha256")
    .update(`rytm-customer-dev:${password}`)
    .digest("hex");
}

function hashPasswordResetToken(token: string) {
  return createHash("sha256")
    .update(`rytm-reset:${token}`)
    .digest("hex");
}

async function sendWelcomeCustomerEmail({
  email,
  name,
  locale,
}: {
  email: string;
  name: string | null;
  locale: Locale;
}) {
  const template = buildWelcomeEmail({
    email,
    name,
    locale,
    accountUrl: `${getPublicAppUrl()}/account?locale=${locale}`,
  });
  await sendEmailNotification({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

function createCustomerPasswordResetUrl(token: string, locale: Locale) {
  const url = new URL("/auth/reset-password", getPublicAppUrl());

  url.searchParams.set("token", token);
  url.searchParams.set("locale", locale);

  return url.toString();
}

function getPublicAppUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
