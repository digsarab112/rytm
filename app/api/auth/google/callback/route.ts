import { NextRequest, NextResponse } from "next/server";

import { createAdminSession } from "@/lib/admin/auth";
import {
  exchangeGoogleCodeForProfile,
  getConfiguredAuthBaseUrl,
  GOOGLE_OAUTH_STATE_COOKIE,
  isAllowedAdminGoogleProfile,
  isGoogleAdminLoginConfigured,
} from "@/lib/admin/google-auth";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const authBaseUrl = getConfiguredAuthBaseUrl(origin);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!isGoogleAdminLoginConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/login?google=not-configured", authBaseUrl),
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/admin/login?google=invalid-state", authBaseUrl),
    );
  }

  try {
    const profile = await exchangeGoogleCodeForProfile({ code, origin });

    if (!isAllowedAdminGoogleProfile(profile) || !profile.email) {
      return NextResponse.redirect(
        new URL("/admin/login?google=unauthorized", authBaseUrl),
      );
    }

    await createAdminSession(profile.email);
    const response = NextResponse.redirect(new URL("/admin", authBaseUrl));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?google=failed", authBaseUrl),
    );
  }
}
