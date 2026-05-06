import crypto from "crypto";

import type { Locale } from "@/lib/i18n/config";
import type { PaymentStatus } from "@/types/cart";

const defaultApiBaseUrl = "https://api.monobank.ua";
let cachedWebhookPublicKey: string | undefined;

export type MonopayCheckoutInput = {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  locale: Locale;
  resultUrl?: string;
  webhookUrl?: string;
};

export type MonopayCheckoutResult = {
  provider: "monopay";
  configured: boolean;
  paymentId: string;
  amount: number;
  currency: string;
  invoiceId?: string;
  checkoutUrl?: string;
  message: string;
};

export type MonopayWebhookPayload = {
  invoiceId?: string;
  status?: string;
  amount?: number;
  ccy?: number;
  finalAmount?: number;
  createdDate?: string;
  modifiedDate?: string;
  reference?: string;
  destination?: string;
  failureReason?: string;
  [key: string]: unknown;
};

export function getMonopayConfig() {
  const token = process.env.MONOPAY_TOKEN || "";
  const publicBaseUrl = getPublicBaseUrl();

  return {
    token,
    apiBaseUrl: (process.env.MONOPAY_API_BASE_URL || defaultApiBaseUrl).replace(
      /\/+$/,
      "",
    ),
    publicBaseUrl,
    webhookUrl: process.env.MONOPAY_WEBHOOK_URL || "",
    resultUrl: process.env.MONOPAY_RESULT_URL || "",
    validitySeconds: getValiditySeconds(),
    isConfigured: Boolean(token),
  };
}

export async function createMonopayCheckout(
  input: MonopayCheckoutInput,
): Promise<MonopayCheckoutResult> {
  const config = getMonopayConfig();
  const paymentId = `monopay-${input.orderId}`;
  const currency = input.currency || "UAH";

  if (!config.isConfigured) {
    return {
      provider: "monopay",
      configured: false,
      paymentId,
      amount: input.amount,
      currency,
      message:
        "Monopay token is missing. Order stays pending until payment is handled manually.",
    };
  }

  try {
    const response = await fetch(
      `${config.apiBaseUrl}/api/merchant/invoice/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": config.token,
          "X-Cms": "Rytm",
          "X-Cms-Version": "0.1.0",
        },
        body: JSON.stringify(buildInvoicePayload(input, config)),
      },
    );

    const payload = (await response.json().catch(() => ({}))) as {
      invoiceId?: string;
      pageUrl?: string;
      errorDescription?: string;
      errText?: string;
      message?: string;
    };

    if (!response.ok || !payload.invoiceId || !payload.pageUrl) {
      return {
        provider: "monopay",
        configured: true,
        paymentId,
        amount: input.amount,
        currency,
        message:
          payload.errorDescription ||
          payload.errText ||
          payload.message ||
          `Monopay invoice request failed with HTTP ${response.status}.`,
      };
    }

    return {
      provider: "monopay",
      configured: true,
      paymentId,
      amount: input.amount,
      currency,
      invoiceId: payload.invoiceId,
      checkoutUrl: payload.pageUrl,
      message: "Monopay invoice created.",
    };
  } catch (error) {
    return {
      provider: "monopay",
      configured: true,
      paymentId,
      amount: input.amount,
      currency,
      message:
        error instanceof Error
          ? error.message
          : "Monopay invoice request failed.",
    };
  }
}

export async function verifyMonopayWebhookSignature(
  rawBody: string,
  signature: string,
) {
  if (!signature.trim()) {
    return false;
  }

  const publicKey = await getWebhookPublicKey(false);

  if (publicKey && verifySignature(publicKey, signature, rawBody)) {
    return true;
  }

  const refreshedPublicKey = await getWebhookPublicKey(true);

  return Boolean(
    refreshedPublicKey && verifySignature(refreshedPublicKey, signature, rawBody),
  );
}

export function parseMonopayWebhookPayload(rawBody: string) {
  return JSON.parse(rawBody) as MonopayWebhookPayload;
}

export function mapMonopayStatus(status?: string): PaymentStatus {
  switch (status) {
    case "success":
      return "paid";
    case "failure":
      return "failed";
    case "reversed":
      return "refunded";
    case "expired":
      return "cancelled";
    case "created":
    case "processing":
    case "hold":
    default:
      return "pending";
  }
}

function buildInvoicePayload(
  input: MonopayCheckoutInput,
  config: ReturnType<typeof getMonopayConfig>,
) {
  const baseUrl = config.publicBaseUrl;
  const resultUrl =
    input.resultUrl ||
    config.resultUrl ||
    (baseUrl
      ? `${baseUrl}/api/payments/monopay/result?order=${encodeURIComponent(
          input.orderId,
        )}&locale=${input.locale}`
      : undefined);
  const webhookUrl =
    input.webhookUrl ||
    config.webhookUrl ||
    (baseUrl ? `${baseUrl}/api/payments/monopay/callback` : undefined);

  return compactObject({
    amount: Math.round(Math.max(0, input.amount) * 100),
    ccy: 980,
    redirectUrl: resultUrl,
    webHookUrl: webhookUrl,
    paymentType: "debit",
    validity: config.validitySeconds,
    merchantPaymInfo: compactObject({
      reference: input.orderId,
      destination: input.description.slice(0, 280),
    }),
  });
}

async function getWebhookPublicKey(forceRefresh: boolean) {
  if (cachedWebhookPublicKey && !forceRefresh) {
    return cachedWebhookPublicKey;
  }

  const config = getMonopayConfig();

  if (!config.isConfigured) {
    return undefined;
  }

  const response = await fetch(`${config.apiBaseUrl}/api/merchant/pubkey`, {
    headers: { "X-Token": config.token },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as { key?: string };
  cachedWebhookPublicKey = payload.key;

  return cachedWebhookPublicKey;
}

function verifySignature(
  publicKeyBase64: string,
  signatureBase64: string,
  rawBody: string,
) {
  try {
    const publicKeyPem = Buffer.from(publicKeyBase64, "base64").toString("utf8");
    const signature = Buffer.from(signatureBase64, "base64");
    const verifier = crypto.createVerify("SHA256");

    verifier.update(rawBody);
    verifier.end();

    return verifier.verify(publicKeyPem, signature);
  } catch {
    return false;
  }
}

function getPublicBaseUrl() {
  return (
    process.env.MONOPAY_PUBLIC_BASE_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    ""
  ).replace(/\/+$/, "");
}

function getValiditySeconds() {
  const value = Number(process.env.MONOPAY_VALIDITY_SECONDS ?? 86400);

  return Number.isFinite(value) && value > 0 ? Math.round(value) : 86400;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ""),
  ) as Partial<T>;
}
