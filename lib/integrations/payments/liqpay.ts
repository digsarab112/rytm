import crypto from "crypto";

import type { PaymentStatus } from "@/types/cart";

export type LiqPayCheckoutInput = {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  resultUrl?: string;
  callbackUrl?: string;
};

export type LiqPayCheckoutResult = {
  provider: "liqpay";
  configured: boolean;
  simulated: boolean;
  paymentId: string;
  checkoutUrl?: string;
  data?: string;
  signature?: string;
  message: string;
};

type LiqPayCallbackPayload = {
  order_id?: string;
  payment_id?: string | number;
  status?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
};

export function getLiqPayConfig() {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY || "";
  const privateKey = process.env.LIQPAY_PRIVATE_KEY || "";

  return {
    publicKey,
    privateKey,
    sandbox: process.env.LIQPAY_SANDBOX !== "false",
    callbackUrl: process.env.LIQPAY_CALLBACK_URL || "",
    resultUrl: process.env.LIQPAY_RESULT_URL || "",
    isConfigured: Boolean(publicKey && privateKey),
  };
}

export function createLiqPayCheckout(
  input: LiqPayCheckoutInput,
): LiqPayCheckoutResult {
  const config = getLiqPayConfig();
  const paymentId = `liqpay-${input.orderId}`;

  if (!config.isConfigured) {
    return {
      provider: "liqpay",
      configured: false,
      simulated: true,
      paymentId,
      message:
        "LiqPay credentials are missing. Checkout stays in pending payment simulation mode.",
    };
  }

  const payload = {
    version: 3,
    public_key: config.publicKey,
    action: "pay",
    amount: input.amount,
    currency: input.currency || "UAH",
    description: input.description,
    order_id: input.orderId,
    sandbox: config.sandbox ? 1 : 0,
    server_url: input.callbackUrl || config.callbackUrl,
    result_url: input.resultUrl || config.resultUrl,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = signLiqPayData(data, config.privateKey);

  return {
    provider: "liqpay",
    configured: true,
    simulated: false,
    paymentId,
    checkoutUrl: "https://www.liqpay.ua/api/3/checkout",
    data,
    signature,
    message: "LiqPay checkout request prepared.",
  };
}

export function verifyLiqPayCallback(data: string, signature: string) {
  const config = getLiqPayConfig();

  if (!config.isConfigured) {
    return {
      ok: false,
      reason: "LiqPay credentials are not configured.",
      payload: null,
    };
  }

  const expectedSignature = signLiqPayData(data, config.privateKey);

  if (!safeEqual(signature, expectedSignature)) {
    return {
      ok: false,
      reason: "Invalid LiqPay callback signature.",
      payload: null,
    };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64").toString("utf8"),
    ) as LiqPayCallbackPayload;

    return {
      ok: true,
      reason: "",
      payload,
    };
  } catch {
    return {
      ok: false,
      reason: "Invalid LiqPay callback payload.",
      payload: null,
    };
  }
}

export function mapLiqPayStatus(status?: string): PaymentStatus {
  switch (status) {
    case "success":
    case "sandbox":
      return "paid";
    case "failure":
    case "error":
      return "failed";
    case "reversed":
      return "refunded";
    case "subscribed":
    case "wait_secure":
    case "wait_accept":
    case "wait_lc":
    case "processing":
    case "prepared":
    default:
      return "pending";
  }
}

function signLiqPayData(data: string, privateKey: string) {
  return crypto
    .createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(valueBuffer, expectedBuffer)
  );
}
