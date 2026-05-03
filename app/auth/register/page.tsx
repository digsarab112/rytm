import type { Metadata } from "next";

import { CustomerRegisterForm } from "@/components/customer/customer-auth-forms";
import { CustomerShell } from "@/components/customer/customer-shell";
import {
  getCustomerCopy,
  getCustomerLocale,
} from "@/lib/customer/customer-copy";
import { isGoogleCustomerLoginConfigured } from "@/lib/customer/google-auth";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Customer registration - Rytm",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = getCustomerLocale(resolvedSearchParams.locale);
  const copy = getCustomerCopy(locale);
  const config = await getStorefrontConfig();
  const googleStatus = Array.isArray(resolvedSearchParams.google)
    ? resolvedSearchParams.google[0]
    : resolvedSearchParams.google;

  return (
    <CustomerShell locale={locale} copy={copy} settings={config.settings}>
      <CustomerRegisterForm
        locale={locale}
        copy={copy}
        googleLoginConfigured={isGoogleCustomerLoginConfigured()}
        googleError={getGoogleLoginError(locale, googleStatus)}
      />
    </CustomerShell>
  );
}

function getGoogleLoginError(locale: "uk" | "ru", status?: string) {
  if (!status) {
    return undefined;
  }

  const messages = {
    uk: {
      unavailable:
        "Вхід через Google зараз недоступний. Скористайтеся email і паролем.",
      "invalid-state": "Сесію Google завершено. Спробуйте ще раз.",
      failed:
        "Не вдалося увійти через Google. Спробуйте ще раз або використайте email.",
    },
    ru: {
      unavailable:
        "Вход через Google сейчас недоступен. Используйте email и пароль.",
      "invalid-state": "Сессия Google завершена. Попробуйте еще раз.",
      failed:
        "Не удалось войти через Google. Попробуйте еще раз или используйте email.",
    },
  } as const;

  return messages[locale][status as keyof (typeof messages)[typeof locale]];
}
