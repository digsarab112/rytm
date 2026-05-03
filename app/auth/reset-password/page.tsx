import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/customer/customer-password-reset-forms";
import { CustomerShell } from "@/components/customer/customer-shell";
import {
  getCustomerCopy,
  getCustomerLocale,
} from "@/lib/customer/customer-copy";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

export const metadata: Metadata = {
  title: "Reset password - Rytm",
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
  const token = Array.isArray(resolvedSearchParams.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams.token;
  const config = await getStorefrontConfig();

  return (
    <CustomerShell locale={locale} copy={copy} settings={config.settings}>
      <ResetPasswordForm locale={locale} copy={copy} token={token ?? ""} />
    </CustomerShell>
  );
}
