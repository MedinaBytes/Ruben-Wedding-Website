import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <main id="main">
      <article>
        <h1>{t("title")}</h1>
        <p>{t("notice")}</p>
        <p>{t("contactPlaceholder")}</p>
      </article>
    </main>
  );
}