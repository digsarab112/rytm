import { NextRequest, NextResponse } from "next/server";

import { createAdminSession } from "@/lib/admin/auth";
import {
  exchangeGoogleCodeForProfile,
  GOOGLE_OAUTH_STATE_COOKIE,
  isAllowedAdminGoogleProfile,
  isGoogleAdminLoginConfigured,
} from "@/lib/admin/google-auth";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!isGoogleAdminLoginConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/login?google=not-configured", origin),
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/admin/login?google=invalid-state", origin),
    );
  }

  try {
    const profile = await exchangeGoogleCodeForProfile({ code, origin });

    if (!isAllowedAdminGoogleProfile(profile) || !profile.email) {
      return NextResponse.redirect(
        new URL("/admin/login?google=unauthorized", origin),
      );
    }

    await createAdminSession(profile.email);
    const response = NextResponse.redirect(new URL("/admin", origin));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?google=failed", origin),
    );
  }
}
