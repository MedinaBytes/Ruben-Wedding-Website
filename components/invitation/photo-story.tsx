import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/invitation/reveal";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import type { Locale } from "@/lib/wedding-config";

export async function PhotoStory({ locale }: { locale?: Locale }) {
  const t = await getTranslations(locale ? { locale, namespace: "gallery" } : "gallery");

  return (
    <section className="photo-story" aria-labelledby="photo-story-title">
      <Reveal className="photo-story__intro">
        <p className="section-label">{t("eyebrow")}</p>
        <h2 id="photo-story-title">{t("title")}</h2>
        <p>{t("description")}</p>
        <span aria-hidden="true" className="photo-story__signature">R <i>&</i> A</span>
      </Reveal>
      <div className="photo-story__gallery">
        <Reveal className="photo-story__frame photo-story__frame--first">
          <WeddingPhoto id="birthday-kiss" alt={t("birthdayAlt")} sizes="(max-width: 760px) 76vw, 29vw" />
          <p>{t("birthdayCaption")}</p>
        </Reveal>
        <Reveal className="photo-story__frame photo-story__frame--second" delay={0.1}>
          <WeddingPhoto id="city-observatory" alt={t("cityAlt")} sizes="(max-width: 760px) 62vw, 23vw" />
          <p>{t("cityCaption")}</p>
        </Reveal>
        <Reveal className="photo-story__frame photo-story__frame--third" delay={0.2}>
          <WeddingPhoto id="sunset-coast-portrait" alt={t("coastAlt")} sizes="(max-width: 760px) 72vw, 27vw" />
          <p>{t("coastCaption")}</p>
        </Reveal>
      </div>
    </section>
  );
}
