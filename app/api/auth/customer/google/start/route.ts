import { NextRequest, NextResponse } from "next/server";

import {
  createCustomerGoogleAuthUrl,
  createCustomerGoogleOAuthState,
  CUSTOMER_GOOGLE_OAUTH_LOCALE_COOKIE,
  CUSTOMER_GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleCustomerLoginConfigured,
  normalizeCustomerGoogleLocale,
} from "@/lib/customer/google-auth";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const locale = normalizeCustomerGoogleLocale(
    request.nextUrl.searchParams.get("locale"),
  );

  if (!isGoogleCustomerLoginConfigured()) {
    return NextResponse.redirect(
      new URL(`/auth/login?locale=${locale}&google=unavailable`, origin),
    );
  }

  const state = createCustomerGoogleOAuthState();
  const response = NextResponse.redirect(
    createCustomerGoogleAuthUrl({ state, origin }),
  );

  response.cookies.set(CUSTOMER_GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set(CUSTOMER_GOOGLE_OAUTH_LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
