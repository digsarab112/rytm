import crypto from "crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "rytm_google_oauth_state";

type GoogleProfile = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export function isGoogleAdminLoginConfigured() {
  const hasSessionSecret = Boolean(
    process.env.ADMIN_SESSION_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      process.env.NODE_ENV !== "production",
  );

  return Boolean(
    process.env.ADMIN_EMAIL &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      hasSessionSecret,
  );
}

export function createGoogleOAuthState() {
  return crypto.randomBytes(24).toString("base64url");
}

export function getConfiguredAuthBaseUrl(origin: string) {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || origin;
}

export function getGoogleRedirectUri(origin: string) {
  const configuredBaseUrl = getConfiguredAuthBaseUrl(origin);

  return `${configuredBaseUrl.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function createGoogleAuthUrl({
  state,
  origin,
}: {
  state: string;
  origin: string;
}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", getGoogleRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function exchangeGoogleCodeForProfile({
  code,
  origin,
}: {
  code: string;
  origin: string;
}): Promise<GoogleProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: getGoogleRedirectUri(origin),
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

export function isAllowedAdminGoogleProfile(profile: GoogleProfile) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const profileEmail = profile.email?.toLowerCase();

  return Boolean(
    adminEmail &&
      profileEmail &&
      profile.email_verified !== false &&
      profileEmail === adminEmail,
  );
}
