import type { Metadata } from "next";

import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

type PageProps = {
  params: Promise<{ section: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  const title = section.join(" / ");

  return {
    title: `${title} - Rytm admin`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { section } = await params;

  return <AdminPlaceholderPage section={`admin/${section.join("/")}`} />;
}
