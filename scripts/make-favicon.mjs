import sharp from "sharp";
import toIco from "to-ico";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Source: the wide-aspect master logo (2816x1536) with the rounded-square
// card centered in the canvas. Lives in scripts/ rather than public/ so it
// doesn't collide with the app-router /icon.png route in production.
//
// Output:
//   - app/icon.png (512x512) — Next.js metadata icon, served at /icon.png
//   - app/favicon.ico (16/32/48 multi-size) — legacy favicon, served at
//     /favicon.ico. Required because browsers (especially when loading
//     before the HTML <head> is parsed) request /favicon.ico directly.

const SRC = resolve("scripts/icon-master.png");
const PNG_OUT = resolve("app/icon.png");
const ICO_OUT = resolve("app/favicon.ico");
const PNG_SIZE = 512;
const ICO_SIZES = [16, 32, 48];

const meta = await sharp(SRC).metadata();
if (!meta.width || !meta.height) {
  throw new Error("Could not read source dimensions");
}

const side = Math.min(meta.width, meta.height);
const left = Math.round((meta.width - side) / 2);
const top = Math.round((meta.height - side) / 2);

// Reusable centered square crop pipeline
function squareCrop() {
  return sharp(SRC).extract({ left, top, width: side, height: side });
}

// 1. Write the high-res square PNG used as the metadata icon.
await squareCrop().resize(PNG_SIZE, PNG_SIZE).png().toFile(PNG_OUT);
console.log(`Wrote ${PNG_OUT} (${meta.width}x${meta.height} → ${PNG_SIZE}x${PNG_SIZE})`);

// 2. Build a multi-size ICO from PNG buffers at each size browsers care about.
const buffers = await Promise.all(
  ICO_SIZES.map((size) =>
    squareCrop().resize(size, size).png().toBuffer()
  )
);
const ico = await toIco(buffers);
writeFileSync(ICO_OUT, ico);
console.log(`Wrote ${ICO_OUT} (sizes: ${ICO_SIZES.join("x, ")}x)`);
