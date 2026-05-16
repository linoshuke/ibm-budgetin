import { Suspense } from "react";
import LoginClient from "./_components/LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <LoginClient />
    </Suspense>
  );
}
