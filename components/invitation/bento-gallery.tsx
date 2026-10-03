"use client";

import { useMemo, useState } from "react";
import { BotanicalCornerAccent } from "@/components/invitation/botanical-accents";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { photoCatalog, type PhotoStoryItem } from "@/lib/photo-catalog";
import type { Locale } from "@/lib/wedding-config";

type Category = "all" | "editorial" | "travel" | "celebration" | "adventures";

const categoryLabels: Record<Category, Record<Locale, string>> = {
  all: { en: "All Memories", es: "Todos los momentos", de: "Alle Momente", hu: "Minden pillanat" },
  editorial: { en: "Portraits & Gala", es: "Retratos de Gala", de: "Porträts", hu: "Portrék" },
  travel: { en: "Travel & Horizons", es: "Viajes y Horizontes", de: "Reisen", hu: "Utazások" },
  celebration: { en: "Celebrations & Love", es: "Celebraciones", de: "Feiern", hu: "Ünneplések" },
  adventures: { en: "Adventures & Sea", es: "Aventuras y Mar", de: "Abenteuer", hu: "Kalandok" },
};

export function BentoGallery({
  locale = "en",
  title = "A life, collected in little moments",
  subtitle = "From small celebrations to faraway sunsets, these are the moments we carry with us.",
  eyebrow = "Curated Memories",
  excludeIds = [],
}: {
  locale?: Locale;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  excludeIds?: readonly string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const filteredPhotos = useMemo(() => {
    let items = photoCatalog as readonly PhotoStoryItem[];
    if (excludeIds.length > 0) {
      items = items.filter((item) => !excludeIds.includes(item.id));
    }
    if (selectedCategory === "all") return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, excludeIds]);

  const activePhoto = activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (activePhotoIndex === null) return;
    if (e.key === "Escape") {
      setActivePhotoIndex(null);
    } else if (e.key === "ArrowRight") {
      setActivePhotoIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowLeft") {
      setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
    }
  }

  return (
    <div className="bento-gallery-block" aria-labelledby="bento-gallery-title">
      <div className="bento-gallery-header">
        <p className="section-label">{eyebrow}</p>
        <h3 id="bento-gallery-title" className="bento-gallery-heading">{title}</h3>
        <p className="bento-gallery-subtitle">{subtitle}</p>

        {/* Category Pills */}
        <div className="bento-category-nav" role="tablist" aria-label="Photo categories">
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`bento-pill ${selectedCategory === cat ? "bento-pill--active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
              type="button"
            >
              {categoryLabels[cat][locale] ?? categoryLabels[cat].en}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="bento-grid">
        {filteredPhotos.map((photo, index) => {
          const isWide = index % 5 === 0 || index % 7 === 0;
          const isTall = index % 4 === 0 && !isWide;
          const photoTitle = photo.title[locale] ?? photo.title.en;
          const photoCaption = photo.caption[locale] ?? photo.caption.en;

          return (
            <figure
              key={photo.id}
              className={`bento-item ${isWide ? "bento-item--wide" : ""} ${isTall ? "bento-item--tall" : ""}`}
              onClick={() => setActivePhotoIndex(index)}
              tabIndex={0}
              role="button"
              aria-label={`${photoTitle}: ${photoCaption}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActivePhotoIndex(index);
                }
              }}
            >
              {isWide && <BotanicalCornerAccent position="top-right" />}
              <WeddingPhoto
                id={photo.id}
                alt={photoCaption}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="bento-image"
              />
              <div className="bento-overlay">
                <span className="bento-tag">{categoryLabels[photo.category][locale]}</span>
                <p className="bento-caption">{photoTitle}</p>
                <p className="bento-subcaption">{photoCaption}</p>
                <span className="bento-zoom-icon" aria-hidden="true">↗</span>
              </div>
            </figure>
          );
        })}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {activePhoto && (
        <div
          className="bento-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title[locale] ?? activePhoto.title.en}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActivePhotoIndex(null);
          }}
        >
          <button
            className="lightbox-close"
            onClick={() => setActivePhotoIndex(null)}
            aria-label="Close photo viewer"
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
            aria-label="Previous photo"
            type="button"
          >
            ‹
          </button>

          <div className="lightbox-content">
            <WeddingPhoto
              id={activePhoto.id}
              alt={activePhoto.caption[locale] ?? activePhoto.caption.en}
              sizes="(max-width: 1200px) 90vw, 1200px"
              className="lightbox-image"
            />
            <div className="lightbox-footer">
              <span className="lightbox-counter">
                {(activePhotoIndex ?? 0) + 1} / {filteredPhotos.length} · {categoryLabels[activePhoto.category][locale]}
              </span>
              <h4 className="lightbox-title">{activePhoto.title[locale] ?? activePhoto.title.en}</h4>
              <p className="lightbox-desc">{activePhoto.caption[locale] ?? activePhoto.caption.en}</p>
            </div>
          </div>

          <button
            className="lightbox-nav lightbox-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
            }}
            aria-label="Next photo"
            type="button"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
