# Wedding Photo and Vector Pipeline

## Source folder

The user's actual repository uses:

```text
Resources/Photos/
```

Do not require the user to rename or move this folder unless there is a clear technical reason.

## Goals

The website should load the couple's actual photographs beautifully without ever shipping the original multi-megabyte files to guests.

## Recommended workflow

```text
Resources/Photos/
        |
        | Sharp build script
        v
public/images/wedding/
        ├── AVIF variants
        ├── WebP variants
        ├── optional fallback JPEG
        └── manifest.json
```

## Processing steps

1. Discover supported photos recursively.
2. Detect dimensions and orientation.
3. Strip EXIF/GPS metadata unless explicitly retained.
4. Apply optional art-directed crops from a config/manifest.
5. Generate only useful responsive widths.
6. Generate AVIF first where supported.
7. Generate WebP fallback.
8. Generate LQIP or tiny blurred placeholder for key photos.
9. Write a deterministic manifest.
10. Never modify source files.

## Suggested widths

```text
320 480 640 768 960 1280 1536 1920
```

Do not generate a width larger than the source image.

## Art direction

A photo can have different crops for:

- hero portrait
- desktop editorial landscape
- mobile portrait
- gallery tile
- timeline side image

The crop configuration should be explicit rather than relying on random `object-position` values scattered across JSX.

## Components

Create one image abstraction that can read the manifest and expose:

- source
- srcSet / responsive variants
- sizes
- width/height
- blur placeholder
- alt text key
- focal point/crop
- priority

Do not hardcode individual generated filenames throughout the app.

## Performance acceptance

For the first screen:

- load only the hero image at high priority
- choose an appropriate mobile/desktop derivative
- keep above-the-fold imagery as small as visual quality permits
- lazy-load gallery and below-the-fold images
- avoid five copies of the same photo in different components

For the full page:

- no full-resolution originals requested by the browser
- no unnecessary preload of gallery images
- no layout shift caused by image dimensions missing

## Vectors

Prefer small custom SVGs for orchids and separators. Run SVGO where useful.

Good uses:
- orchid stems
- petals
- botanical corners
- monograms
- dividers
- location/music icons

Avoid:
- enormous traced photographs
- decorative SVGs with thousands of unnecessary nodes
- embedded base64 photographs inside SVG
