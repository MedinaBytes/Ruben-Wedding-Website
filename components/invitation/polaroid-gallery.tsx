"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { photoCatalog, type PhotoStoryItem } from "@/lib/photo-catalog";
import type { Locale } from "@/lib/wedding-config";

type PhotoLocale = "en" | "es" | "de" | "hu";

function photoText(values: Record<PhotoLocale, string>, locale: Locale) {
  return values[locale === "de-AT" ? "de" : locale] ?? values.en;
}

// Organic rotation angles for authentic polaroid look
const ROTATIONS = [
  "-1.5deg",
  "1.2deg",
  "-0.8deg",
  "1.6deg",
  "-1.2deg",
  "0.8deg",
  "-1.8deg",
  "1.4deg",
  "-0.6deg",
  "1.1deg",
  "-1.4deg",
];

export function PolaroidGallery({ locale = "en" }: { locale?: Locale }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Curated photos without the hero
  const photos = (photoCatalog as readonly PhotoStoryItem[]).filter(
    (item) => item.id !== "formal-staircase-hero",
  );

  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

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
      setActivePhotoIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
    }
  }

  return (
    <div className="polaroid-gallery" aria-label="Photo Memories">
      <div className="polaroid-grid">
        {photos.map((item, index) => {
          const title = photoText(item.title, locale);
          const caption = photoText(item.caption, locale);
          const rotation = ROTATIONS[index % ROTATIONS.length];

          return (
            <button
              key={item.id}
              type="button"
              className="polaroid-card"
              style={{ "--polaroid-rot": rotation } as React.CSSProperties}
              onClick={() => setActivePhotoIndex(index)}
              aria-label={`View photo: ${title}`}
            >
              {/* Photo Frame */}
              <div className="polaroid-card__photo-wrap">
                <WeddingPhoto
                  id={item.id}
                  alt={caption}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  className="polaroid-card__photo"
                />
              </div>

              {/* Polaroid Bottom Chin with Original Title */}
              <div className="polaroid-card__caption">
                <span className="polaroid-card__title">{title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox Photo Viewer */}
      <dialog
        ref={dialogRef}
        className="polaroid-lightbox"
        aria-label="Photo Viewer"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setActivePhotoIndex(null);
          }
        }}
        onClose={() => setActivePhotoIndex(null)}
        onKeyDown={handleKeyDown}
      >
        {activePhoto && (
          <div className="polaroid-lightbox__container">
            <div className="polaroid-lightbox__frame">
              <div className="polaroid-lightbox__image-wrap">
                <WeddingPhoto
                  id={activePhoto.id}
                  alt={photoText(activePhoto.caption, locale)}
                  sizes="(max-width: 1200px) 92vw, 1100px"
                  className="polaroid-lightbox__image"
                />
              </div>

              <div className="polaroid-lightbox__info">
                <h3 className="polaroid-lightbox__title">
                  {photoText(activePhoto.title, locale)}
                </h3>
                <p className="polaroid-lightbox__desc">
                  {photoText(activePhoto.caption, locale)}
                </p>
                <span className="polaroid-lightbox__counter">
                  {activePhotoIndex !== null ? activePhotoIndex + 1 : 1} / {photos.length}
                </span>
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              type="button"
              className="polaroid-lightbox__nav polaroid-lightbox__nav--prev"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))
              }
              aria-label="Previous photo"
            >
              ‹
            </button>

            <button
              type="button"
              className="polaroid-lightbox__nav polaroid-lightbox__nav--next"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))
              }
              aria-label="Next photo"
            >
              ›
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              className="polaroid-lightbox__close"
              onClick={() => setActivePhotoIndex(null)}
              aria-label="Close photo viewer"
            >
              ✕
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
