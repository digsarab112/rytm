import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") || "";
  const locale = url.searchParams.get("locale") || "uk";

  if (orderId) {
    redirect(`/${locale}/order-success?order=${encodeURIComponent(orderId)}`);
  }

  redirect(`/${locale}/checkout`);
}
