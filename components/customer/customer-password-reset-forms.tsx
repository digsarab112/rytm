"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestCustomerPasswordReset,
  resetCustomerPassword,
} from "@/lib/customer/customer-actions";
import type { CustomerCopy } from "@/lib/customer/customer-copy";
import type { Locale } from "@/lib/i18n/config";

type PasswordResetFormProps = {
  locale: Locale;
  copy: CustomerCopy;
};

export function ForgotPasswordForm({ locale, copy }: PasswordResetFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const text = getPasswordResetCopy(locale);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setError(copy.required);
      return;
    }

    setIsPending(true);
    await requestCustomerPasswordReset({ email, locale });
    setIsPending(false);
    setMessage(text.sent);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">{text.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {text.description}
      </p>
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        {error ? <Feedback text={error} tone="error" /> : null}
        {message ? <Feedback text={message} tone="success" /> : null}
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          {copy.email}
          <Input name="email" type="email" autoComplete="email" required />
        </label>
        <Button type="submit" size="lg" disabled={isPending}>
          <Mail />
          {isPending ? text.sending : text.submit}
        </Button>
        <BackToLoginLink locale={locale} label={copy.goToLogin} />
      </form>
    </div>
  );
}

export function ResetPasswordForm({
  locale,
  copy,
  token,
}: PasswordResetFormProps & {
  token: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const text = getPasswordResetCopy(locale);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!token) {
      setError(text.invalid);
      return;
    }

    if (!password) {
      setError(copy.required);
      return;
    }

    setIsPending(true);
    const result = await resetCustomerPassword({ token, password });
    setIsPending(false);

    if (!result.ok) {
      setError(result.error === "weak" ? copy.weak : text.invalid);
      return;
    }

    setMessage(text.changed);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">{text.newTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {text.newDescription}
      </p>
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        {error ? <Feedback text={error} tone="error" /> : null}
        {message ? <Feedback text={message} tone="success" /> : null}
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          {copy.password}
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <Button type="submit" size="lg" disabled={isPending || Boolean(message)}>
          <KeyRound />
          {isPending ? text.saving : text.save}
        </Button>
        <BackToLoginLink locale={locale} label={copy.goToLogin} />
      </form>
    </div>
  );
}

function BackToLoginLink({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link
      href={`/auth/login?locale=${locale}`}
      className="text-sm font-bold text-primary hover:underline"
    >
      {label}
    </Link>
  );
}

function Feedback({ text, tone }: { text: string; tone: "success" | "error" }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-semibold leading-6 ${
        tone === "success"
          ? "border-secondary bg-secondary/30 text-secondary-foreground"
          : "border-primary/30 bg-background text-primary"
      }`}
    >
      {text}
    </div>
  );
}

function getPasswordResetCopy(locale: Locale) {
  if (locale === "ru") {
    return {
      title: "Восстановление пароля",
      description:
        "Введите email аккаунта. Если аккаунт существует, мы отправим ссылку для изменения пароля.",
      submit: "Отправить ссылку",
      sending: "Отправляем...",
      sent: "Если аккаунт найден, письмо со ссылкой уже отправлено.",
      newTitle: "Создать новый пароль",
      newDescription: "Введите новый пароль для вашего аккаунта Rytm.",
      save: "Сохранить пароль",
      saving: "Сохраняем...",
      changed: "Пароль изменен. Теперь можно войти с новым паролем.",
      invalid: "Ссылка недействительна или срок действия истек.",
    };
  }

  return {
    title: "Відновлення пароля",
    description:
      "Введіть email акаунта. Якщо акаунт існує, ми надішлемо посилання для зміни пароля.",
    submit: "Надіслати посилання",
    sending: "Надсилаємо...",
    sent: "Якщо акаунт знайдено, лист із посиланням уже надіслано.",
    newTitle: "Створити новий пароль",
    newDescription: "Введіть новий пароль для вашого акаунта Rytm.",
    save: "Зберегти пароль",
    saving: "Зберігаємо...",
    changed: "Пароль змінено. Тепер можна увійти з новим паролем.",
    invalid: "Посилання недійсне або строк дії минув.",
  };
}
