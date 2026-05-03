"use server";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";

type NewsletterState = {
  status?: "success" | "error";
};

export async function subscribeToNewsletter(
  _state: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "uk") === "ru" ? "ru" : "uk";

  if (!email || !email.includes("@")) {
    return { status: "error" };
  }

  if (isDatabaseConfigured()) {
    await getPrismaClient().newsletterSubscription.upsert({
      where: { email },
      update: {
        locale,
        status: "active",
        source: "homepage",
        unsubscribedAt: null,
      },
      create: {
        email,
        locale,
        source: "homepage",
      },
    });
  }

  return { status: "success" };
}
