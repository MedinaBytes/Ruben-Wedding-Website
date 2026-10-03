"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { photoCatalog, type PhotoStoryItem } from "@/lib/photo-catalog";
import type { Locale } from "@/lib/wedding-config";

type Category = "all" | "editorial" | "travel" | "celebration" | "adventures";
type PhotoLocale = "en" | "es" | "de" | "hu";

function photoText(values: Record<PhotoLocale, string>, locale: Locale) {
  return values[locale === "de-AT" ? "de" : locale] ?? values.en;
}

const categoryLabels: Record<Category, Record<Locale, string>> = {
  all: { en: "All memories", es: "Todos los recuerdos", "de-AT": "Alle Erinnerungen", hu: "Minden emlék" },
  editorial: { en: "Portraits & Gala", es: "Retratos de Gala", "de-AT": "Porträts", hu: "Portrék" },
  travel: { en: "Travel & Horizons", es: "Viajes y Horizontes", "de-AT": "Reisen", hu: "Utazások" },
  celebration: { en: "Celebrations & Love", es: "Celebraciones", "de-AT": "Feiern", hu: "Ünneplések" },
  adventures: { en: "Adventures & Sea", es: "Aventuras y Mar", "de-AT": "Abenteuer", hu: "Kalandok" },
};

export function BentoGallery({
  locale = "en",
  title = "A life, collected in little moments",
  subtitle = "From small celebrations to faraway sunsets, these are the moments we carry with us.",
  filterLabel = "Filter memories",
  viewerLabel = "Photo viewer",
  openPhotoLabel = "Open photo: {title}",
  closeViewerLabel = "Close photo viewer",
  previousPhotoLabel = "Previous photo",
  nextPhotoLabel = "Next photo",
  photoCountLabel = "{current} of {total} photos",
  excludeIds = [],
}: {
  locale?: Locale;
  title?: string;
  subtitle?: string;
  filterLabel?: string;
  viewerLabel?: string;
  openPhotoLabel?: string;
  closeViewerLabel?: string;
  previousPhotoLabel?: string;
  nextPhotoLabel?: string;
  photoCountLabel?: string;
  excludeIds?: readonly string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openingButtonRef = useRef<HTMLButtonElement | null>(null);

  const availablePhotos = useMemo(
    () => (photoCatalog as readonly PhotoStoryItem[]).filter((item) => !excludeIds.includes(item.id)),
    [excludeIds],
  );
  const filteredPhotos = useMemo(
    () => selectedCategory === "all"
      ? availablePhotos
      : availablePhotos.filter((item) => item.category === selectedCategory),
    [availablePhotos, selectedCategory],
  );

  const activePhoto = activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activePhoto && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (!activePhoto && dialog.open) {
      dialog.close();
    }
  }, [activePhoto]);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (activePhotoIndex === null) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActivePhotoIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
    }
  }

  return (
    <div className="bento-gallery-block" aria-labelledby="bento-gallery-title">
      <div className="bento-gallery-header">
        <h3 id="bento-gallery-title" className="bento-gallery-heading">{title}</h3>
        <p className="bento-gallery-subtitle">{subtitle}</p>

        <div aria-label={filterLabel} className="bento-category-nav" role="group">
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <button
              aria-pressed={selectedCategory === cat}
              key={cat}
              className={`bento-pill ${selectedCategory === cat ? "bento-pill--active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
              type="button"
            >
              {categoryLabels[cat][locale]}{cat === "all" ? ` (${availablePhotos.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="bento-grid">
        {filteredPhotos.map((photo, index) => {
          const isWide = index % 5 === 0 || index % 7 === 0;
          const isTall = index % 4 === 0 && !isWide;
          const photoTitle = photoText(photo.title, locale);
          const photoCaption = photoText(photo.caption, locale);

          return (
            <figure
              key={photo.id}
              className={`bento-item ${isWide ? "bento-item--wide" : ""} ${isTall ? "bento-item--tall" : ""}`}
            >
              <div className="bento-item__photo">
                <WeddingPhoto
                  id={photo.id}
                  alt=""
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="bento-image"
                />
                <span className="bento-zoom-icon" aria-hidden="true">↗</span>
              </div>
              <figcaption className="bento-overlay">
                <span className="bento-tag">{categoryLabels[photo.category][locale]}</span>
                <p className="bento-caption">{photoTitle}</p>
                <p className="bento-subcaption">{photoCaption}</p>
              </figcaption>
              <button
                aria-label={openPhotoLabel.replace("{title}", photoTitle)}
                className="bento-item__open"
                onClick={(event) => {
                  openingButtonRef.current = event.currentTarget;
                  setActivePhotoIndex(index);
                }}
                type="button"
              />
            </figure>
          );
        })}
      </div>

      <dialog
        aria-label={viewerLabel}
        className="bento-lightbox"
        onCancel={(event) => {
          event.preventDefault();
          setActivePhotoIndex(null);
        }}
        onClose={() => {
          openingButtonRef.current?.focus();
          openingButtonRef.current = null;
          setActivePhotoIndex(null);
        }}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          if (event.target === event.currentTarget) setActivePhotoIndex(null);
        }}
        ref={dialogRef}
      >
        {activePhoto && (
          <>
          <button
            className="lightbox-close"
            onClick={() => setActivePhotoIndex(null)}
            aria-label={closeViewerLabel}
            ref={closeButtonRef}
            type="button"
          >
            ✕
          </button>

          <button
            className="lightbox-nav lightbox-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
            }}
            aria-label={previousPhotoLabel}
            type="button"
          >
            ‹
          </button>

          <div className="lightbox-content">
            <WeddingPhoto
              id={activePhoto.id}
              alt={photoText(activePhoto.caption, locale)}
              sizes="(max-width: 1200px) 90vw, 1200px"
              className="lightbox-image"
            />
            <div className="lightbox-footer">
              <span className="lightbox-counter">
                {photoCountLabel
                  .replace("{current}", String((activePhotoIndex ?? 0) + 1))
                  .replace("{total}", String(filteredPhotos.length))} · {categoryLabels[activePhoto.category][locale]}
              </span>
              <h4 className="lightbox-title">{photoText(activePhoto.title, locale)}</h4>
              <p className="lightbox-desc">{photoText(activePhoto.caption, locale)}</p>
            </div>
          </div>

          <button
            className="lightbox-nav lightbox-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
            }}
            aria-label={nextPhotoLabel}
            type="button"
          >
            ›
          </button>
          </>
        )}
      </dialog>
    </div>
  );
}
