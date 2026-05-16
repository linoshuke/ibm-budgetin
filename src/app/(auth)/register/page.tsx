import { Suspense } from "react";
import RegisterClient from "./_components/RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <RegisterClient />
    </Suspense>
  );
}
