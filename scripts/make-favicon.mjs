import sharp from "sharp";
import { resolve } from "node:path";

// Source: the wide-aspect master logo (2816x1536) with the rounded-square
// card centered in the canvas.
// Output: a square 512x512 favicon at app/icon.png — Next.js picks this up
// automatically and serves it at /icon.png.

const SRC = resolve("public/icon.png");
const OUT = resolve("app/icon.png");
const SIZE = 512;

const meta = await sharp(SRC).metadata();
if (!meta.width || !meta.height) {
  throw new Error("Could not read source dimensions");
}

const side = Math.min(meta.width, meta.height);
const left = Math.round((meta.width - side) / 2);
const top = Math.round((meta.height - side) / 2);

await sharp(SRC)
  .extract({ left, top, width: side, height: side })
  .resize(SIZE, SIZE)
  .png()
  .toFile(OUT);

console.log(`Wrote ${OUT} (${meta.width}x${meta.height} → ${SIZE}x${SIZE})`);
