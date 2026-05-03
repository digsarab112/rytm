"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";

import { loginAdmin, type AdminLoginState } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AdminLoginState = {};

export function AdminLoginForm({
  googleLoginConfigured,
  googleError,
  passwordLoginEnabled,
}: {
  googleLoginConfigured: boolean;
  googleError?: string;
  passwordLoginEnabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 grid gap-5">
      {state.error ? (
        <div className="rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm font-semibold text-primary">
          {state.error}
        </div>
      ) : null}
      {googleError ? (
        <div className="rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm font-semibold text-primary">
          {googleError}
        </div>
      ) : null}
      {googleLoginConfigured ? (
        <Button asChild size="lg" className="w-full">
          <Link href="/api/auth/google/start">
            <Mail />
            Sign in with Google
          </Link>
        </Button>
      ) : (
        <div className="rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm leading-6 text-primary">
          Google admin login is not configured. Set ADMIN_EMAIL,
          GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_URL, and
          ADMIN_SESSION_SECRET in the server environment.
        </div>
      )}
      {passwordLoginEnabled ? (
        <>
          <div className="relative h-px bg-border">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              local fallback
            </span>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Email
            <Input
              name="email"
              type="email"
              autoComplete="username"
              required={!googleLoginConfigured}
              placeholder="admin@example.com"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Password
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required={!googleLoginConfigured}
              placeholder="Password"
            />
          </label>
          <Button type="submit" size="lg" disabled={isPending}>
            <LockKeyhole />
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </>
      ) : null}
    </form>
  );
}
