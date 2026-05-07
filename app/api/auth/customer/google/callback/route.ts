import { NextRequest, NextResponse } from "next/server";

import {
  createOrUpdateGoogleCustomerSession,
  CUSTOMER_GOOGLE_OAUTH_LOCALE_COOKIE,
  CUSTOMER_GOOGLE_OAUTH_STATE_COOKIE,
  CUSTOMER_GOOGLE_SESSION_COOKIE,
  encodeCustomerSession,
  exchangeCustomerGoogleCodeForProfile,
  getConfiguredCustomerAuthBaseUrl,
  isGoogleCustomerLoginConfigured,
  normalizeCustomerGoogleLocale,
} from "@/lib/customer/google-auth";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const authBaseUrl = getConfiguredCustomerAuthBaseUrl(origin);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(
    CUSTOMER_GOOGLE_OAUTH_STATE_COOKIE,
  )?.value;
  const locale = normalizeCustomerGoogleLocale(
    request.cookies.get(CUSTOMER_GOOGLE_OAUTH_LOCALE_COOKIE)?.value ?? null,
  );

  if (!isGoogleCustomerLoginConfigured()) {
    return NextResponse.redirect(
      new URL(`/auth/login?locale=${locale}&google=unavailable`, authBaseUrl),
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL(`/auth/login?locale=${locale}&google=invalid-state`, authBaseUrl),
    );
  }

  try {
    const profile = await exchangeCustomerGoogleCodeForProfile({ code, origin });
    const session = await createOrUpdateGoogleCustomerSession(profile);
    const response = NextResponse.redirect(
      new URL(`/auth/google/complete?locale=${locale}`, authBaseUrl),
    );

    response.cookies.set(CUSTOMER_GOOGLE_SESSION_COOKIE, encodeCustomerSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60,
    });
    response.cookies.delete(CUSTOMER_GOOGLE_OAUTH_STATE_COOKIE);
    response.cookies.delete(CUSTOMER_GOOGLE_OAUTH_LOCALE_COOKIE);

    return response;
  } catch {
    return NextResponse.redirect(
      new URL(`/auth/login?locale=${locale}&google=failed`, authBaseUrl),
    );
  }
}
