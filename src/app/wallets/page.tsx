import { redirect } from "next/navigation";
import type { Route } from "next";

export default function WalletsRedirectPage() {
  redirect("/dompet" as Route);
}
