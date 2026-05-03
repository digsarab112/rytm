export type EmailSendInput = {
  to: string;
  subject: string;
  text: string;
};

export type EmailSendResult = {
  ok: boolean;
  provider: string;
  simulated: boolean;
  messageId?: string;
  error?: string;
};

export function getEmailIntegrationStatus() {
  const provider = process.env.EMAIL_PROVIDER || "simulated";

  return {
    provider,
    isConfigured:
      (provider === "resend" && Boolean(process.env.RESEND_API_KEY)) ||
      (provider === "smtp" &&
        Boolean(process.env.SMTP_HOST) &&
        Boolean(process.env.SMTP_USER) &&
        Boolean(process.env.SMTP_PASSWORD)),
    fromEmail: process.env.FROM_EMAIL || "no-reply@rytm.local",
  };
}

export async function sendEmailNotification(
  input: EmailSendInput,
): Promise<EmailSendResult> {
  const status = getEmailIntegrationStatus();

  if (!status.isConfigured) {
    return {
      ok: true,
      provider: status.provider,
      simulated: true,
      messageId: `sim-email-${Date.now().toString(36)}`,
    };
  }

  return {
    ok: false,
    provider: status.provider,
    simulated: false,
    error: `Real ${status.provider} email sending is prepared but not implemented yet for ${input.to}.`,
  };
}
