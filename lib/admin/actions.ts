"use server";

import { redirect } from "next/navigation";

import {
  createAdminSession,
  destroyAdminSession,
  getAdminCredentials,
  isAdminPasswordLoginEnabled,
  verifyAdminCustomerCredentials,
  verifyAdminCredentials,
} from "@/lib/admin/auth";

export type AdminLoginState = {
  error?: string;
};

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  if (!isAdminPasswordLoginEnabled()) {
    return {
      error:
        "Password admin login is disabled. Use the configured Google admin account.",
    };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const credentials = getAdminCredentials();

  if (!credentials) {
    return {
      error:
        "Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.",
    };
  }

  if (!verifyAdminCredentials(email, password)) {
    if (await verifyAdminCustomerCredentials(email, password)) {
      await createAdminSession(email.trim().toLowerCase());
      redirect("/admin");
    }

    return { error: "Invalid email or password." };
  }

  await createAdminSession(credentials.email);
  redirect("/admin");
}

export async function loginAdminFromCustomerLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  if (!isAdminPasswordLoginEnabled()) {
    return { ok: false as const };
  }

  const credentials = getAdminCredentials();
  const normalizedEmail = email.trim().toLowerCase();

  if (
    credentials &&
    normalizedEmail === credentials.email.toLowerCase() &&
    verifyAdminCredentials(email, password)
  ) {
    await createAdminSession(credentials.email);
    return { ok: true as const };
  }

  if (await verifyAdminCustomerCredentials(email, password)) {
    await createAdminSession(normalizedEmail);
    return { ok: true as const };
  }

  return { ok: false as const };
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login");
}
