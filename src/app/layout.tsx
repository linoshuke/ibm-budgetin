import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const headlineFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "Budgetin",
  description: "Budget tracker modern dengan Supabase + Realtime.",
  icons: {
    icon: "/Budgetin.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === "production";
  const headerList = await headers();
  const nonce =
    headerList.get("x-csp-nonce") ??
    (() => {
      const csp = headerList.get("content-security-policy") ?? "";
      const nonceMatch = csp.match(/'nonce-([^']+)'/);
      return nonceMatch ? nonceMatch[1] : "";
    })();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseOrigin = "";
  try {
    supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    supabaseOrigin = "";
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
      </head>
      <body className={`${headlineFont.variable} ${bodyFont.variable} antialiased`}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
        {isProd ? <Analytics /> : null}
        {isProd ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
