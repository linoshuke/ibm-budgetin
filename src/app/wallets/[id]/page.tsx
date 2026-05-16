import { redirect } from "next/navigation";
import type { Route } from "next";

export default function WalletDetailRedirectPage({ params }: { params: { id: string } }) {
  const id = params?.id ?? "";
  redirect((`/dompet/${encodeURIComponent(id)}` as Route));
}
