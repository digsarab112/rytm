import nodemailer from "nodemailer";

export type EmailSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  return {
    provider,
    isConfigured:
      (provider === "resend" && Boolean(process.env.RESEND_API_KEY)) ||
      (provider === "smtp" &&
        Boolean(process.env.SMTP_HOST) &&
        Boolean(process.env.SMTP_USER) &&
        Boolean(process.env.SMTP_PASSWORD)),
    fromEmail: process.env.FROM_EMAIL || "no-reply@rytm.local",
    fromName: process.env.FROM_NAME || "Rytm",
    smtpPort: Number.isFinite(smtpPort) ? smtpPort : 587,
    smtpSecure:
      process.env.SMTP_SECURE === "true" ||
      process.env.SMTP_PORT === "465",
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

  if (status.provider === "resend") {
    return sendResendEmail(input, status.fromEmail, status.fromName);
  }

  if (status.provider === "smtp") {
    return sendSmtpEmail(input, status);
  }

  return {
    ok: false,
    provider: status.provider,
    simulated: false,
    error: `Unsupported email provider: ${status.provider}.`,
  };
}

async function sendResendEmail(
  input: EmailSendInput,
  fromEmail: string,
  fromName: string,
): Promise<EmailSendResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: formatSender(fromEmail, fromName),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        provider: "resend",
        simulated: false,
        error: payload.message || payload.error || response.statusText,
      };
    }

    return {
      ok: true,
      provider: "resend",
      simulated: false,
      messageId: payload.id,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "resend",
      simulated: false,
      error: error instanceof Error ? error.message : "Resend email failed.",
    };
  }
}

async function sendSmtpEmail(
  input: EmailSendInput,
  status: ReturnType<typeof getEmailIntegrationStatus>,
): Promise<EmailSendResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: status.smtpPort,
      secure: status.smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    const result = await transporter.sendMail({
      from: formatSender(status.fromEmail, status.fromName),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return {
      ok: true,
      provider: "smtp",
      simulated: false,
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "smtp",
      simulated: false,
      error: error instanceof Error ? error.message : "SMTP email failed.",
    };
  }
}

function formatSender(email: string, name: string) {
  const safeName = name.replaceAll('"', "");

  return safeName ? `"${safeName}" <${email}>` : email;
}
