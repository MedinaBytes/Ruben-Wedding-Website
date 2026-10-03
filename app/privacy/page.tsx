import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <main className="privacy-page" id="main">
      <article>
        <h1>{t("title")}</h1>
        <p>{t("notice")}</p>
        <section aria-labelledby="privacy-collection">
          <h2 id="privacy-collection">{t("collection.title")}</h2>
          <p>{t("collection.body")}</p>
        </section>
        <section aria-labelledby="privacy-purpose">
          <h2 id="privacy-purpose">{t("purpose.title")}</h2>
          <p>{t("purpose.body")}</p>
        </section>
        <section aria-labelledby="privacy-services">
          <h2 id="privacy-services">{t("services.title")}</h2>
          <p>{t("services.body")}</p>
        </section>
        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">{t("retention.title")}</h2>
          <p>{t("retention.body")}</p>
        </section>
        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">{t("contact.title")}</h2>
          <p>{t("contact.body")}</p>
        </section>
      </article>
    </main>
  );
}