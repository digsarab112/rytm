import {
  mapLiqPayStatus,
  verifyLiqPayCallback,
} from "@/lib/integrations/payments/liqpay";

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid LiqPay callback form payload." },
      { status: 400 },
    );
  }

  const data = String(formData.get("data") ?? "");
  const signature = String(formData.get("signature") ?? "");

  if (!data || !signature) {
    return Response.json(
      { ok: false, error: "Missing LiqPay callback data or signature." },
      { status: 400 },
    );
  }

  const verification = verifyLiqPayCallback(data, signature);

  if (!verification.ok || !verification.payload) {
    return Response.json(
      { ok: false, error: verification.reason },
      { status: 400 },
    );
  }

  return Response.json({
    ok: true,
    simulated: true,
    orderId: verification.payload.order_id,
    paymentId: verification.payload.payment_id,
    paymentStatus: mapLiqPayStatus(verification.payload.status),
    note: "Callback verified. Database payment update is prepared for the Prisma/PostgreSQL phase.",
  });
}
