import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@/lib/generated/prisma/client";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";
import {
  mapMonopayStatus,
  parseMonopayWebhookPayload,
  verifyMonopayWebhookSignature,
} from "@/lib/integrations/payments/monopay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-sign") ?? "";
  const isVerified = await verifyMonopayWebhookSignature(rawBody, signature);

  if (!isVerified) {
    return Response.json(
      { ok: false, error: "Invalid Monopay webhook signature." },
      { status: 400 },
    );
  }

  let payload: ReturnType<typeof parseMonopayWebhookPayload>;

  try {
    payload = parseMonopayWebhookPayload(rawBody);
  } catch {
    return Response.json(
      { ok: false, error: "Invalid Monopay webhook payload." },
      { status: 400 },
    );
  }

  if (!payload.invoiceId) {
    return Response.json(
      { ok: false, error: "Missing Monopay invoice ID." },
      { status: 400 },
    );
  }

  const paymentStatus = mapMonopayStatus(payload.status);

  if (isDatabaseConfigured()) {
    const prisma = getPrismaClient();
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        externalId: payload.invoiceId,
        provider: PaymentProvider.MONOPAY,
      },
      select: { id: true, orderId: true },
    });

    if (transaction) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: toPrismaPaymentStatus(paymentStatus),
          rawPayload: payload as Prisma.InputJsonObject,
        },
      });
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { paymentStatus: toPrismaPaymentStatus(paymentStatus) },
      });
    }
  }

  return Response.json({
    ok: true,
    invoiceId: payload.invoiceId,
    paymentStatus,
  });
}

function toPrismaPaymentStatus(status: ReturnType<typeof mapMonopayStatus>) {
  switch (status) {
    case "paid":
      return PaymentStatus.PAID;
    case "failed":
      return PaymentStatus.FAILED;
    case "cancelled":
      return PaymentStatus.CANCELLED;
    case "refunded":
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.PENDING;
  }
}
