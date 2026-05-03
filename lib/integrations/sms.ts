export type SmsSendInput = {
  to: string;
  message: string;
};

export type SmsSendResult = {
  ok: boolean;
  provider: string;
  simulated: boolean;
  messageId?: string;
  error?: string;
};

export function getSmsIntegrationStatus() {
  const provider = process.env.SMS_PROVIDER || "simulated";
  const hasTurboSmsToken = Boolean(process.env.TURBOSMS_API_TOKEN);
  const hasAlphaSmsToken = Boolean(process.env.ALPHASMS_API_TOKEN);

  return {
    provider,
    isConfigured:
      (provider === "turbosms" && hasTurboSmsToken) ||
      (provider === "alphasms" && hasAlphaSmsToken),
    enableViber: process.env.ENABLE_VIBER === "true",
    enableSmsFallback: process.env.ENABLE_SMS_FALLBACK !== "false",
  };
}

export async function sendSmsNotification(
  input: SmsSendInput,
): Promise<SmsSendResult> {
  const status = getSmsIntegrationStatus();

  if (!status.isConfigured) {
    return {
      ok: true,
      provider: status.provider,
      simulated: true,
      messageId: `sim-sms-${Date.now().toString(36)}`,
    };
  }

  return {
    ok: false,
    provider: status.provider,
    simulated: false,
    error: `Real ${status.provider} sending is prepared but not implemented yet for ${input.to}.`,
  };
}
