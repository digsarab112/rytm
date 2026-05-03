import crypto from "crypto";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import type { CustomerSession } from "@/types/customer";

export const CUSTOMER_GOOGLE_OAUTH_STATE_COOKIE =
  "rytm_customer_google_oauth_state";
export const CUSTOMER_GOOGLE_OAUTH_LOCALE_COOKIE =
  "rytm_customer_google_oauth_locale";
export const CUSTOMER_GOOGLE_SESSION_COOKIE = "rytm_customer_google_session";

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export function isGoogleCustomerLoginConfigured() {
  return Boolean(
    isDatabaseConfigured() &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function createCustomerGoogleOAuthState() {
  return crypto.randomBytes(24).toString("base64url");
}

export function getCustomerGoogleRedirectUri(origin: string) {
  const configuredBaseUrl =
    process.env.AUTH_URL || process.env.NEXTAUTH_URL || origin;

  return `${configuredBaseUrl.replace(
    /\/$/,
    "",
  )}/api/auth/customer/google/callback`;
}

export function createCustomerGoogleAuthUrl({
  state,
  origin,
}: {
  state: string;
  origin: string;
}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", getCustomerGoogleRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function exchangeCustomerGoogleCodeForProfile({
  code,
  origin,
}: {
  code: string;
  origin: string;
}) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: getCustomerGoogleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Google OAuth token exchange failed.");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenPayload.access_token) {
    throw new Error("Google OAuth token response did not include access token.");
  }

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        authorization: `Bearer ${tokenPayload.access_token}`,
      },
    },
  );

  if (!profileResponse.ok) {
    throw new Error("Google profile request failed.");
  }

  return (await profileResponse.json()) as GoogleProfile;
}

export async function createOrUpdateGoogleCustomerSession(
  profile: GoogleProfile,
): Promise<CustomerSession> {
  if (!isGoogleCustomerLoginConfigured()) {
    throw new Error("Google customer login is unavailable.");
  }

  if (!profile.sub || !profile.email || profile.email_verified === false) {
    throw new Error("Google profile is missing a verified email.");
  }

  const prisma = getPrismaClient();
  const normalizedEmail = profile.email.trim().toLowerCase();
  const existingByProvider = await prisma.customer.findFirst({
    where: {
      provider: "google",
      providerAccountId: profile.sub,
    },
  });

  const customer =
    existingByProvider ??
    (await prisma.customer.upsert({
      where: { email: normalizedEmail },
      update: {
        name: profile.name || normalizedEmail,
        provider: "google",
        providerAccountId: profile.sub,
        profile: {
          upsert: {
            create: {},
            update: {},
          },
        },
      },
      create: {
        email: normalizedEmail,
        name: profile.name || normalizedEmail,
        provider: "google",
        providerAccountId: profile.sub,
        profile: {
          create: {},
        },
      },
    }));

  return {
    customerId: customer.id,
    name: customer.name ?? customer.email,
    email: customer.email,
    createdAt: new Date().toISOString(),
  };
}

export function encodeCustomerSession(session: CustomerSession) {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeCustomerSession(value: string) {
  return JSON.parse(
    Buffer.from(value, "base64url").toString("utf8"),
  ) as CustomerSession;
}

export function normalizeCustomerGoogleLocale(locale: string | null): Locale {
  return locale === "ru" ? "ru" : "uk";
}
