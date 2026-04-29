import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("public/icon.png");
const OUT = resolve("public/nahw-mark.png");

// Threshold: pixels with R, G, B all >= this become transparent.
// The logo card is near-white (~#F4F4F2), calligraphy is dark navy.
const THRESHOLD = 215;

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const buf = Buffer.from(data);

// Bounding box of the non-near-white pixels = the calligraphy
let minX = width, minY = height, maxX = 0, maxY = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    const isNearWhite = r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD;
    if (isNearWhite) {
      buf[i + 3] = 0; // alpha = 0
    } else {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`bbox: x=${minX}..${maxX} y=${minY}..${maxY}`);

const PAD = 60;
const left = Math.max(0, minX - PAD);
const top = Math.max(0, minY - PAD);
const right = Math.min(width, maxX + PAD);
const bottom = Math.min(height, maxY + PAD);
const cropW = right - left;
const cropH = bottom - top;

await sharp(buf, { raw: { width, height, channels } })
  .extract({ left, top, width: cropW, height: cropH })
  .png()
  .toFile(OUT);

console.log(`wrote ${OUT} (${cropW}x${cropH})`);
