import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  getAdminSession,
  isAdminPasswordLoginEnabled,
} from "@/lib/admin/auth";
import { isGoogleAdminLoginConfigured } from "@/lib/admin/google-auth";

export const metadata: Metadata = {
  title: "Admin login - Rytm",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const googleLoginMessages: Record<string, string> = {
  "not-configured":
    "Google login is not configured. Set ADMIN_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_URL, and ADMIN_SESSION_SECRET.",
  "invalid-state": "Google login session expired. Please try again.",
  unauthorized:
    "This Google account is not allowed. Only ADMIN_EMAIL can access admin.",
  failed: "Google login failed. Please try again.",
};

export default async function Page({ searchParams }: PageProps) {
  const session = await getAdminSession();
  const resolvedSearchParams = await searchParams;
  const googleStatus = Array.isArray(resolvedSearchParams.google)
    ? resolvedSearchParams.google[0]
    : resolvedSearchParams.google;

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#f7ece2] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-border bg-card p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          <AdminLoginForm
            googleLoginConfigured={isGoogleAdminLoginConfigured()}
            passwordLoginEnabled={isAdminPasswordLoginEnabled()}
            googleError={
              googleStatus ? googleLoginMessages[googleStatus] : undefined
            }
          />
        </section>
      </div>
    </main>
  );
}
