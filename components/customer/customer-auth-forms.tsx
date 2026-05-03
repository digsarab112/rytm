"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCustomerSession,
  loginCustomer,
  registerCustomer,
} from "@/lib/customer/auth-storage";
import type { CustomerCopy } from "@/lib/customer/customer-copy";
import type { Locale } from "@/lib/i18n/config";

type CustomerAuthFormProps = {
  locale: Locale;
  copy: CustomerCopy;
  googleLoginConfigured?: boolean;
  googleError?: string;
};

export function CustomerRegisterForm({
  locale,
  copy,
  googleLoginConfigured = false,
  googleError,
}: CustomerAuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [session] = useState(() => getCustomerSession());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      setError(copy.required);
      return;
    }

    setIsPending(true);
    const result = await registerCustomer({ name, email, password, locale });
    setIsPending(false);

    if (!result.ok) {
      setError(copy[result.error]);
      return;
    }

    if ("admin" in result) {
      window.location.href = "/admin";
      return;
    }

    router.push(`/account?locale=${locale}`);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">
        {copy.registerTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {copy.registerText}
      </p>
      {session ? (
        <SignedInNotice locale={locale} copy={copy} name={session.name} />
      ) : (
        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          {error ? <ErrorMessage text={error} /> : null}
          {googleError ? <ErrorMessage text={googleError} /> : null}
          <GoogleLoginOption
            locale={locale}
            enabled={googleLoginConfigured}
          />
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.name}
            <Input name="name" autoComplete="name" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.email}
            <Input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.password}
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
          <Button type="submit" size="lg" disabled={isPending}>
            <UserPlus />
            {isPending ? copy.createAccount : copy.createAccount}
          </Button>
          <p className="text-sm text-muted-foreground">
            {copy.hasAccount}{" "}
            <Link
              href={`/auth/login?locale=${locale}`}
              className="font-bold text-primary hover:underline"
            >
              {copy.goToLogin}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export function CustomerLoginForm({
  locale,
  copy,
  googleLoginConfigured = false,
  googleError,
}: CustomerAuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [session] = useState(() => getCustomerSession());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError(copy.required);
      return;
    }

    setIsPending(true);
    const result = await loginCustomer({ email, password });
    setIsPending(false);

    if (!result.ok) {
      setError(copy[result.error]);
      return;
    }

    router.push(`/account?locale=${locale}`);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">{copy.loginTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {copy.loginText}
      </p>
      {session ? (
        <SignedInNotice locale={locale} copy={copy} name={session.name} />
      ) : (
        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          {error ? <ErrorMessage text={error} /> : null}
          {googleError ? <ErrorMessage text={googleError} /> : null}
          <GoogleLoginOption
            locale={locale}
            enabled={googleLoginConfigured}
          />
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.email}
            <Input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.password}
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <Button type="submit" size="lg" disabled={isPending}>
            <LogIn />
            {isPending ? copy.signIn : copy.signIn}
          </Button>
          <Link
            href={`/auth/forgot-password?locale=${locale}`}
            className="text-sm font-bold text-primary hover:underline"
          >
            {locale === "uk" ? "Забули пароль?" : "Забыли пароль?"}
          </Link>
          <p className="text-sm text-muted-foreground">
            {copy.noAccount}{" "}
            <Link
              href={`/auth/register?locale=${locale}`}
              className="font-bold text-primary hover:underline"
            >
              {copy.goToRegister}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

function GoogleLoginOption({
  locale,
  enabled,
}: {
  locale: Locale;
  enabled: boolean;
}) {
  if (!enabled) {
    return null;
  }

  return (
    <>
      <Button asChild size="lg" variant="outline">
        <Link href={`/api/auth/customer/google/start?locale=${locale}`}>
          <Mail />
          {locale === "uk" ? "Продовжити з Google" : "Продолжить с Google"}
        </Link>
      </Button>
      <div className="relative h-px bg-border">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {locale === "uk" ? "або" : "или"}
        </span>
      </div>
    </>
  );
}

function SignedInNotice({
  locale,
  copy,
  name,
}: {
  locale: Locale;
  copy: CustomerCopy;
  name: string;
}) {
  return (
    <div className="mt-6 rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-semibold text-foreground">
        {copy.signedInAs} {name}
      </p>
      <Button asChild className="mt-4">
        <Link href={`/account?locale=${locale}`}>{copy.account}</Link>
      </Button>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm font-semibold text-primary">
      {text}
    </div>
  );
}
