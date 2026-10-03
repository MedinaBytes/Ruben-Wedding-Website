import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp, { type Metadata } from "sharp";

import { imageCurations, type ImageCuration } from "./image-curation";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "Resources", "Photos");
const outputRoot = path.join(projectRoot, "public", "images", "wedding");
const manifestPath = path.join(outputRoot, "manifest.json");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Changing any encoding setting invalidates every cached derivative.
const encoding = {
  widths: [320, 480, 640, 960, 1200, 1600],
  avif: { quality: 52, effort: 5 },
  webp: { quality: 76, effort: 5 },
} as const;
const settingsHash = createHash("sha1").update(JSON.stringify(encoding)).digest("hex").slice(0, 12);

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
  role: ImageCuration["role"];
  sourceHash: string;
  originalDimensions: { width: number; height: number };
  focalPoint: { x: number; y: number };
  altTextKey: string;
  dominantColor: string;
  blurDataURL: string;
  variants: ManifestVariant[];
};

type ImageManifest = {
  version: 2;
  settingsHash: string;
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

/** Responsive widths never upscale, and always include the source width as the sharpest variant. */
function targetWidths(sourceWidth: number) {
  const widths = encoding.widths.filter((width) => width < sourceWidth);
  return [...widths, sourceWidth];
}

function toHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

async function readPreviousManifest(): Promise<ImageManifest | undefined> {
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Partial<ImageManifest>;
    return manifest.version === 2 ? (manifest as ImageManifest) : undefined;
  } catch {
    return undefined;
  }
}

async function filesExist(image: ManifestImage) {
  try {
    await Promise.all(
      image.variants.flatMap((variant) =>
        [variant.formats.avif.src, variant.formats.webp.src].map((src) =>
          access(path.join(outputRoot, path.basename(src))),
        ),
      ),
    );
    return true;
  } catch {
    return false;
  }
}

async function optimizeImage(sourcePath: string, sourceHash: string, curation: ImageCuration): Promise<ManifestImage> {
  const sourceMetadata = await sharp(sourcePath).metadata();
  const originalDimensions = orientedDimensions(sourceMetadata);
  const blurBytes = await sharp(sourcePath)
    .rotate()
    .resize({ width: 32, withoutEnlargement: true })
    .blur(6)
    .jpeg({ quality: 35, mozjpeg: true })
    .toBuffer();
  const { dominant } = await sharp(sourcePath).rotate().resize({ width: 64 }).stats();
  const variants: ManifestVariant[] = [];

  for (const width of targetWidths(originalDimensions.width)) {
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
    await pipeline.clone().avif(encoding.avif).toFile(avifPath);
    await pipeline.clone().webp(encoding.webp).toFile(webpPath);

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
    sourceHash,
    originalDimensions,
    focalPoint: curation.focalPoint,
    altTextKey: curation.altTextKey,
    dominantColor: `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`,
    blurDataURL: `data:image/jpeg;base64,${blurBytes.toString("base64")}`,
    variants,
  };
}

async function removeStaleGeneratedFiles(current: ImageManifest) {
  const currentFiles = new Set(
    current.images.flatMap((image) =>
      image.variants.flatMap((variant) => [
        path.basename(variant.formats.avif.src),
        path.basename(variant.formats.webp.src),
      ]),
    ),
  );
  const entries = await readdir(outputRoot);

  // Only generated derivatives are ever removed; the manifest and any other file stay untouched.
  await Promise.all(
    entries
      .filter((filename) => /\.(avif|webp)$/.test(filename) && !currentFiles.has(filename))
      .map((filename) => rm(path.join(outputRoot, filename), { force: true })),
  );
}

async function main() {
  const sourceFiles = await listSourceImages(sourceRoot);
  const sourceByName = new Map(sourceFiles.map((file) => [path.basename(file), file]));
  const curatedNames = new Set<string>(imageCurations.map(({ sourceFilename }) => sourceFilename));
  const missingSource = imageCurations.find(({ sourceFilename }) => !sourceByName.has(sourceFilename));
  const uncurated = sourceFiles.filter((file) => !curatedNames.has(path.basename(file)));

  if (missingSource) {
    throw new Error(`A curated source photo is missing: ${missingSource.id}.`);
  }
  if (uncurated.length > 0) {
    console.warn(`${uncurated.length} source photo(s) are not curated and will not be published. Add them to scripts/image-curation.ts.`);
  }

  await mkdir(outputRoot, { recursive: true });
  const previousManifest = await readPreviousManifest();
  const previousById = new Map(
    previousManifest?.settingsHash === settingsHash
      ? previousManifest.images.map((image) => [image.id, image])
      : [],
  );
  const images: ManifestImage[] = [];
  let reused = 0;

  for (const curation of imageCurations as readonly ImageCuration[]) {
    const sourcePath = sourceByName.get(curation.sourceFilename);
    if (!sourcePath) throw new Error(`A curated source photo is missing: ${curation.id}.`);

    const sourceHash = createHash("sha1").update(await readFile(sourcePath)).digest("hex");
    const previous = previousById.get(curation.id);

    if (previous && previous.sourceHash === sourceHash && (await filesExist(previous))) {
      // Placement metadata may change without re-encoding the pixels.
      images.push({ ...previous, role: curation.role, focalPoint: curation.focalPoint, altTextKey: curation.altTextKey });
      reused += 1;
      continue;
    }

    images.push(await optimizeImage(sourcePath, sourceHash, curation));
  }

  const manifest: ImageManifest = {
    version: 2,
    settingsHash,
    sourceCount: sourceFiles.length,
    images,
  };

  await removeStaleGeneratedFiles(manifest);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const totalBytes = images.reduce(
    (sum, image) => sum + image.variants.reduce((inner, variant) => inner + variant.formats.avif.bytes + variant.formats.webp.bytes, 0),
    0,
  );
  console.log(
    `Optimized ${images.length} curated photos from ${sourceFiles.length} private sources ` +
      `(${images.length - reused} encoded, ${reused} unchanged; ${(totalBytes / 1024 / 1024).toFixed(1)} MB of derivatives).`,
  );
  console.log(`Manifest: public/images/wedding/manifest.json`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Image optimization failed.");
  process.exitCode = 1;
});