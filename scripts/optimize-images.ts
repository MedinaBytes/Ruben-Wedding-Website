import { readdir, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp, { type Metadata } from "sharp";

import { imageCurations } from "./image-curation";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "Resources", "Photos");
const outputRoot = path.join(projectRoot, "public", "images", "wedding");
const manifestPath = path.join(outputRoot, "manifest.json");
const requestedWidths = [320, 480, 640, 768, 960, 1200, 1536, 1920];
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

type VariantFormat = {
  src: string;
  bytes: number;
};

type ManifestVariant = {
  width: number;
  height: number;
  formats: {
    avif: VariantFormat;
    webp: VariantFormat;
  };
};

type ManifestImage = {
  id: string;
  role: string;
  originalDimensions: { width: number; height: number };
  focalPoint: { x: number; y: number };
  altTextKey: string;
  blurDataURL: string;
  variants: ManifestVariant[];
};

type ImageManifest = {
  version: 1;
  sourceCount: number;
  images: ManifestImage[];
};

async function listSourceImages(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSourceImages(entryPath);
      if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
        return [entryPath];
      }
      return [];
    }),
  );

  return nested.flat().sort((first, second) => first.localeCompare(second));
}

function orientedDimensions(metadata: Metadata) {
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error("A selected photo has no readable dimensions.");
  }

  const swapsDimensions = metadata.orientation !== undefined && metadata.orientation >= 5 && metadata.orientation <= 8;
  return swapsDimensions ? { width: height, height: width } : { width, height };
}

function hasEmbeddedMetadata(metadata: Metadata) {
  return Boolean(metadata.exif || metadata.iptc || metadata.xmp);
}

async function readPreviousManifest(): Promise<ImageManifest | undefined> {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8")) as ImageManifest;
  } catch {
    return undefined;
  }
}

async function optimizeImage(
  sourcePath: string,
  curation: (typeof imageCurations)[number],
): Promise<ManifestImage> {
  const sourceMetadata = await sharp(sourcePath).metadata();
  const originalDimensions = orientedDimensions(sourceMetadata);
  const widths = requestedWidths.filter((width) => width <= originalDimensions.width);
  const blurBytes = await sharp(sourcePath)
    .rotate()
    .resize({ width: 32, withoutEnlargement: true })
    .blur(6)
    .jpeg({ quality: 35, mozjpeg: true })
    .toBuffer();
  const variants: ManifestVariant[] = [];

  for (const width of widths) {
    const baseName = `${curation.id}-${width}`;
    const avifName = `${baseName}.avif`;
    const webpName = `${baseName}.webp`;
    const pipeline = sharp(sourcePath, { failOn: "error" }).rotate().resize({
      width,
      withoutEnlargement: true,
      fit: "inside",
    });

    const avifPath = path.join(outputRoot, avifName);
    const webpPath = path.join(outputRoot, webpName);
    await pipeline.clone().avif({ quality: 52, effort: 5 }).toFile(avifPath);
    await pipeline.clone().webp({ quality: 76, effort: 5 }).toFile(webpPath);

    const [avifMetadata, webpMetadata, avifStats, webpStats] = await Promise.all([
      sharp(avifPath).metadata(),
      sharp(webpPath).metadata(),
      stat(avifPath),
      stat(webpPath),
    ]);

    for (const metadata of [avifMetadata, webpMetadata]) {
      if (!metadata.width || !metadata.height || metadata.width > originalDimensions.width || metadata.height > originalDimensions.height) {
        throw new Error(`Generated dimensions are invalid for ${curation.id}.`);
      }
      if (hasEmbeddedMetadata(metadata)) {
        throw new Error(`Generated image metadata was not stripped for ${curation.id}.`);
      }
    }

    variants.push({
      width: avifMetadata.width,
      height: avifMetadata.height ?? 0,
      formats: {
        avif: { src: `/images/wedding/${avifName}`, bytes: avifStats.size },
        webp: { src: `/images/wedding/${webpName}`, bytes: webpStats.size },
      },
    });
  }

  return {
    id: curation.id,
    role: curation.role,
    originalDimensions,
    focalPoint: curation.focalPoint,
    altTextKey: curation.altTextKey,
    blurDataURL: `data:image/jpeg;base64,${blurBytes.toString("base64")}`,
    variants,
  };
}

async function removeStaleGeneratedFiles(previous: ImageManifest | undefined, current: ImageManifest) {
  if (!previous) return;

  const currentFiles = new Set(
    current.images.flatMap((image) =>
      image.variants.flatMap((variant) => [variant.formats.avif.src, variant.formats.webp.src]),
    ),
  );
  const oldFiles = previous.images.flatMap((image) =>
    image.variants.flatMap((variant) => [variant.formats.avif.src, variant.formats.webp.src]),
  );

  await Promise.all(
    oldFiles
      .filter((src) => !currentFiles.has(src))
      .map(async (src) => {
        const filename = path.basename(src);
        if (filename === src.replace("/images/wedding/", "") && /\.(avif|webp)$/.test(filename)) {
          await rm(path.join(outputRoot, filename), { force: true });
        }
      }),
  );
}

async function main() {
  const sourceFiles = await listSourceImages(sourceRoot);
  const sourceByName = new Map(sourceFiles.map((file) => [path.basename(file), file]));
  const missingSource = imageCurations.find(({ sourceFilename }) => !sourceByName.has(sourceFilename));

  if (missingSource) {
    throw new Error(`A curated source photo is missing: ${missingSource.id}.`);
  }

  await mkdir(outputRoot, { recursive: true });
  const previousManifest = await readPreviousManifest();
  const images = [];

  for (const curation of imageCurations) {
    const sourcePath = sourceByName.get(curation.sourceFilename);
    if (!sourcePath) throw new Error(`A curated source photo is missing: ${curation.id}.`);
    images.push(await optimizeImage(sourcePath, curation));
  }

  const manifest: ImageManifest = {
    version: 1,
    sourceCount: sourceFiles.length,
    images,
  };

  await removeStaleGeneratedFiles(previousManifest, manifest);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Optimized ${images.length} curated photos from ${sourceFiles.length} private sources.`);
  console.log(`Manifest: public/images/wedding/manifest.json`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Image optimization failed.");
  process.exitCode = 1;
});