import Image from "next/image";

import { getWeddingPhoto } from "@/lib/images/manifest";

export function WeddingPhoto({
  id,
  alt,
  sizes,
  preload = false,
  className,
}: {
  id: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  const photo = getWeddingPhoto(id);
  const sourceSet = (format: "avif" | "webp") =>
    photo.variants
      .map((variant) => `${variant.formats[format].src} ${variant.width}w`)
      .join(", ");
  const fallback = photo.variants.at(-1)?.formats.webp.src;

  if (!fallback) throw new Error(`No responsive image variants exist for ${id}.`);

  return (
    <picture className="photo-frame">
      <source sizes={sizes} srcSet={sourceSet("avif")} type="image/avif" />
      <source sizes={sizes} srcSet={sourceSet("webp")} type="image/webp" />
      <Image
        alt={alt}
        className={className}
        height={photo.originalDimensions.height}
        placeholder="blur"
        blurDataURL={photo.blurDataURL}
        fetchPriority={preload ? "high" : undefined}
        loading={preload ? "eager" : "lazy"}
        sizes={sizes}
        src={fallback}
        style={{ objectPosition: `${photo.focalPoint.x}% ${photo.focalPoint.y}%` }}
        unoptimized
        width={photo.originalDimensions.width}
      />
    </picture>
  );
}