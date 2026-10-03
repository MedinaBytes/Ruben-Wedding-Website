---
applyTo: "Resources/Photos/**/*,public/images/**/*,public/**/*.svg,**/*.{jpg,jpeg,png,webp,avif,svg}"
---
# Wedding Asset Rules

`Resources/Photos/` is private source material from the couple.

Never:
- modify originals in place
- expose raw source files from a public URL
- add EXIF/GPS metadata to derivatives
- create oversized hero images
- duplicate the same large image into many uncontrolled locations

Use a deterministic image pipeline with Sharp. Generate only dimensions actually useful to the design and do not upscale.

Prefer AVIF/WebP derivatives and responsive sources. Use a manifest that describes image role, dimensions, crop/focal point, file size and alt-text key.

Use meaningful filenames such as:

```text
couple-portrait-hero
couple-walking-vienna
couple-garden-editorial
couple-detail-rings
```

Do not invent descriptions of photos that are not visible.

For SVGs, prefer small handcrafted or properly licensed vector assets. Optimize with SVGO when appropriate. Do not embed raster images inside SVGs for decorative artwork.

All external assets must have verified licenses recorded in `docs/ASSET_LICENSES.md`.
