import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const t = await getTranslations("foundation");

  return (
    <main id="main">
      <section aria-labelledby="admin-title">
        <h1 id="admin-title">{t("adminTitle")}</h1>
        <p>{t("adminUnavailable")}</p>
      </section>
    </main>
  );
}