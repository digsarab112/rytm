import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CustomerGoogleComplete } from "@/components/customer/customer-google-complete";
import {
  CUSTOMER_GOOGLE_SESSION_COOKIE,
  decodeCustomerSession,
  normalizeCustomerGoogleLocale,
} from "@/lib/customer/google-auth";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const localeParam = Array.isArray(resolvedSearchParams.locale)
    ? resolvedSearchParams.locale[0]
    : resolvedSearchParams.locale;
  const locale = normalizeCustomerGoogleLocale(localeParam ?? null);
  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(CUSTOMER_GOOGLE_SESSION_COOKIE)?.value;

  if (!encodedSession) {
    redirect(`/auth/login?locale=${locale}`);
  }

  let session;

  try {
    session = decodeCustomerSession(encodedSession);
  } catch {
    redirect(`/auth/login?locale=${locale}`);
  }

  return <CustomerGoogleComplete locale={locale} session={session} />;
}
