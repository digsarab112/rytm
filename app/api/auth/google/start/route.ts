import { NextResponse } from "next/server";

import {
  createGoogleAuthUrl,
  createGoogleOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleAdminLoginConfigured,
} from "@/lib/admin/google-auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isGoogleAdminLoginConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/login?google=not-configured", origin),
    );
  }

  const state = createGoogleOAuthState();
  const response = NextResponse.redirect(
    createGoogleAuthUrl({ state, origin }),
  );

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
