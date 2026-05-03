import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/admin/auth";
import { getStorefrontConfig } from "@/lib/platform/storefront-config.server";

type ProtectedAdminLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const config = await getStorefrontConfig();

  return (
    <AdminShell session={session} settings={config.settings}>
      {children}
    </AdminShell>
  );
}
