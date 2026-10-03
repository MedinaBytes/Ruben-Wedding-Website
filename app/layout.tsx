import "./globals.css";

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { weddingConfig } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: `${weddingConfig.couple.displayNames} | ${t("titleSuffix")}`,
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("accessibility"),
  ]);

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main">
          {t("skipToContent")}
        </a>
        {children}
      </body>
    </html>
  );
}