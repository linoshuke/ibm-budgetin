import { redirect } from "next/navigation";
import type { Route } from "next";

export default function MoreRedirectPage() {
  redirect("/lainnya" as Route);
}
