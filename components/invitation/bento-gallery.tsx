"use client";

import { useMemo, useState } from "react";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { imageCurations } from "@/scripts/image-curation";

type Category = "all" | "editorial" | "travel" | "celebration" | "adventures" | "candid";

const categoryMap: Record<string, Category> = {
  "formal-staircase-hero": "editorial",
  "birthday-kiss": "celebration",
  "city-observatory": "travel",
  "sunset-coast-portrait": "editorial",
  "garden-formal-portrait": "editorial",
  "coastal-full-length": "editorial",
  "night-city-embrace": "travel",
  "garden-hug": "celebration",
  "lake-church-portrait": "travel",
  "boat-deck-sunshine": "travel",
  "kayak-adventure": "adventures",
  "kayak-sea-view": "adventures",
  "palace-square": "travel",
  "wine-toast": "celebration",
  "modern-waterfront": "travel",
  "river-city-view": "travel",
  "birthday-balloon": "celebration",
  "white-horse-meeting": "adventures",
  "country-lane-ride": "adventures",
  "scooter-helmets": "adventures",
  "bay-lookout": "travel",
  "historic-rooftop": "travel",
  "city-skyline-selfie": "candid",
  "turquoise-sea-toast": "celebration",
  "cinema-night": "candid",
  "party-glasses": "candid",
  "evening-swing": "candid",
  "waterfront-selfie": "candid",
  "forest-hilltop": "adventures",
  "flight-selfie": "travel",
  "rooftop-pool-swim": "adventures",
  "cafe-lunch": "candid",
  "winter-elevator-selfie": "candid",
  "turquoise-sea-smile": "celebration",
  "silly-faces": "candid",
};

const categoryLabels: Record<Category, { en: string; es: string; de: string; hu: string }> = {
  all: { en: "All Moments (35)", es: "Todos los momentos (35)", de: "Alle Momente (35)", hu: "Minden pillanat (35)" },
  editorial: { en: "Editorial & Portraits", es: "Editoriales y Retratos", de: "Porträts", hu: "Portrék" },
  travel: { en: "Travel & Panoramas", es: "Viajes y Panorámicas", de: "Reisen & Städte", hu: "Utazások" },
  celebration: { en: "Celebrations & Dates", es: "Celebraciones", de: "Feiern", hu: "Ünneplések" },
  adventures: { en: "Adventures & Nature", es: "Aventuras", de: "Abenteuer", hu: "Kalandok" },
  candid: { en: "Candid & Fun", es: "Espontáneas", de: "Spontan & Spaß", hu: "Spontán fotók" },
};

export function BentoGallery({
  locale = "en",
  title = "A life, collected in little moments",
  subtitle = "From small celebrations to faraway sunsets, these are the 35 memories that brought us here.",
  eyebrow = "Curated Memory Matrix",
}: {
  locale?: "en" | "es" | "de" | "hu";
  title?: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "all") return imageCurations;
    return imageCurations.filter((item) => (categoryMap[item.id] ?? "candid") === selectedCategory);
  }, [selectedCategory]);

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
    <section className="bento-gallery-section" aria-labelledby="bento-gallery-title">
      <div className="bento-gallery-header">
        <p className="section-label">{eyebrow}</p>
        <h2 id="bento-gallery-title">{title}</h2>
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
          // Compute asymmetrical grid span classes for visual dynamism
          const isWide = index % 5 === 0 || index % 7 === 0;
          const isTall = index % 4 === 0 && !isWide;

          return (
            <figure
              key={photo.id}
              className={`bento-item ${isWide ? "bento-item--wide" : ""} ${isTall ? "bento-item--tall" : ""}`}
              onClick={() => setActivePhotoIndex(index)}
              tabIndex={0}
              role="button"
              aria-label={`View photo ${photo.id.replace(/-/g, " ")}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActivePhotoIndex(index);
                }
              }}
            >
              <WeddingPhoto
                id={photo.id}
                alt={photo.id.replace(/-/g, " ")}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="bento-image"
              />
              <div className="bento-overlay">
                <span className="bento-tag">{categoryMap[photo.id] ?? "memory"}</span>
                <p className="bento-caption">{photo.id.replace(/-/g, " ")}</p>
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
          aria-label="Full screen photo view"
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
              alt={activePhoto.id.replace(/-/g, " ")}
              sizes="(max-width: 1200px) 90vw, 1200px"
              className="lightbox-image"
            />
            <div className="lightbox-footer">
              <span className="lightbox-counter">
                {(activePhotoIndex ?? 0) + 1} / {filteredPhotos.length}
              </span>
              <p className="lightbox-title">{activePhoto.id.replace(/-/g, " ")}</p>
              <span className="lightbox-role">Category: {categoryMap[activePhoto.id] ?? "memory"}</span>
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
    </section>
  );
}
