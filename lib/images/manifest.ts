import manifest from "../../public/images/wedding/manifest.json";

type ImageVariant = {
  width: number;
  height: number;
  formats: {
    avif: { src: string; bytes: number };
    webp: { src: string; bytes: number };
  };
};

type WeddingPhoto = {
  id: string;
  role: string;
  originalDimensions: { width: number; height: number };
  focalPoint: { x: number; y: number };
  altTextKey: string;
  blurDataURL: string;
  variants: ImageVariant[];
};

const photos = new Map(
  (manifest.images as WeddingPhoto[]).map((photo) => [photo.id, photo]),
);

export function getWeddingPhoto(id: string): WeddingPhoto {
  const photo = photos.get(id);
  if (!photo) throw new Error(`Wedding image is not in the manifest: ${id}.`);
  return photo;
}