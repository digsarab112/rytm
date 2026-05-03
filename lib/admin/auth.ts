import crypto from "crypto";
import { cookies } from "next/headers";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";

const ADMIN_COOKIE_NAME = "rytm_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
};

export type AdminSession = {
  email: string;
  expiresAt: Date;
};

export function isAdminPasswordLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ADMIN_PASSWORD_LOGIN_ENABLED === "true"
  );
}

export function getAdminCredentials() {
  if (!isAdminPasswordLoginEnabled()) {
    return null;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (email && password) {
    return { email, password };
  }

  return null;
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV !== "production" ? "rytm-dev-session-secret" : "")
  );
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing admin session secret");
  }

  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(payload: AdminSessionPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token: string): AdminSession | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminSessionPayload;

    if (!payload.email || !payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return {
      email: payload.email,
      expiresAt: new Date(payload.expiresAt),
    };
  } catch {
    return null;
  }
}

function safeCompare(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export function verifyAdminCredentials(email: string, password: string) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return false;
  }

  return (
    safeCompare(email.trim().toLowerCase(), credentials.email.toLowerCase()) &&
    safeCompare(password, credentials.password)
  );
}

export async function verifyAdminCustomerCredentials(
  email: string,
  password: string,
) {
  if (!isDatabaseConfigured()) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const adminEmail = getAdminCredentials()?.email.toLowerCase();

  if (!adminEmail || normalizedEmail !== adminEmail) {
    return false;
  }

  const customer = await getPrismaClient().customer.findUnique({
    where: { email: normalizedEmail },
  });

  return Boolean(
    customer?.passwordHash &&
      safeCompare(customer.passwordHash, hashCustomerPassword(password)),
  );
}

function hashCustomerPassword(password: string) {
  return crypto
    .createHash("sha256")
    .update(`rytm-customer-dev:${password}`)
    .digest("hex");
}

export async function createAdminSession(email: string) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const token = createSessionToken({ email, expiresAt });

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  return token ? verifySessionToken(token) : null;
}
