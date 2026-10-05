import { getTranslations } from "next-intl/server";

import { PolaroidGallery } from "@/components/invitation/polaroid-gallery";
import { Reveal } from "@/components/invitation/reveal";
import type { Locale } from "@/lib/wedding-config";

export async function PhotoStory({ locale }: { locale?: Locale }) {
  const t = locale
    ? await getTranslations({ locale, namespace: "gallery" })
    : await getTranslations("gallery");

  return (
    <section className="photo-story" aria-labelledby="photo-story-title">
      <Reveal className="photo-story__intro">
        <p className="section-label">{t("eyebrow")}</p>
        <h2 id="photo-story-title">{t("title")}</h2>
        <p>{t("description")}</p>
        <span aria-hidden="true" className="photo-story__signature">
          R <i>&</i> A
        </span>
      </Reveal>

      <Reveal delay={0.15}>
        <PolaroidGallery
          locale={locale ?? "en"}
          memoriesLabel={t("memoriesLabel")}
          viewerLabel={t("viewerLabel")}
          openPhotoLabel={t("viewPhotoLabel")}
          closeViewerLabel={t("closeViewerLabel")}
          previousPhotoLabel={t("previousPhotoLabel")}
          nextPhotoLabel={t("nextPhotoLabel")}
        />
      </Reveal>
    </section>
  );
}
