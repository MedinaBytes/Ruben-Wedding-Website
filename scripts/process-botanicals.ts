import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function main() {
  const uploadDir = "C:\\Users\\Jonathan\\.gemini\\antigravity-ide\\brain\\647e99f2-4dd1-4dc4-aad4-be972f75af3a\\.user_uploaded";
  const targetDir = path.resolve("public/images/botanicals");
  await fs.mkdir(targetDir, { recursive: true });

  const greenOrchidSrc = path.join(uploadDir, "media_1791044163769.png");
  const pinkOrchidSrc = path.join(uploadDir, "media_1791044168565.png");

  // Process green orchid (has checkerboard background or alpha; let's ensure transparent PNG and WebP)
  const greenMeta = await sharp(greenOrchidSrc).metadata();
  console.log("Green Orchid Metadata:", greenMeta.width, greenMeta.height, greenMeta.channels, greenMeta.hasAlpha);

  const greenImage = sharp(greenOrchidSrc);
  const { data: gData, info: gInfo } = await greenImage.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < gData.length; i += 4) {
    const r = gData[i];
    const g = gData[i + 1];
    const b = gData[i + 2];

    // Detect grey/white checkerboard background pixels: (r ≈ g ≈ b and lightness > 180 and green saturation is very low)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Background checkerboard is neutral grey (#CBCBCB or #FFFFFF), diff < 15 and high brightness
    if (diff < 20 && min > 175) {
      gData[i + 3] = 0;
    } else if (diff < 30 && min > 165 && (g - r) < 15) {
      gData[i + 3] = 0;
    }
  }

  await sharp(gData, {
    raw: {
      width: gInfo.width,
      height: gInfo.height,
      channels: 4,
    },
  })
    .png({ quality: 95 })
    .toFile(path.join(targetDir, "orchid-matcha.png"));

  await sharp(gData, {
    raw: {
      width: gInfo.width,
      height: gInfo.height,
      channels: 4,
    },
  })
    .webp({ quality: 90 })
    .toFile(path.join(targetDir, "orchid-matcha.webp"));

  // Process pink orchid (remove pure white background to make transparent)
  const pinkMeta = await sharp(pinkOrchidSrc).metadata();
  console.log("Pink Orchid Metadata:", pinkMeta.width, pinkMeta.height, pinkMeta.channels, pinkMeta.hasAlpha);

  const pinkImage = sharp(pinkOrchidSrc);
  const { data, info } = await pinkImage.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  // Threshold white background to transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // If pixel is near pure white or soft light blue glow background
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0;
    } else if (r > 220 && g > 230 && b > 245) {
      const alpha = Math.max(0, 255 - ((r + g + b) / 3 - 200) * 5);
      data[i + 3] = Math.min(data[i + 3], alpha);
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ quality: 95 })
    .toFile(path.join(targetDir, "orchid-pink.png"));

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .webp({ quality: 90 })
    .toFile(path.join(targetDir, "orchid-pink.webp"));

  console.log("Botanical assets generated in public/images/botanicals!");
}

main().catch(console.error);
