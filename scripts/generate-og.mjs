/**
 * Renders public/images/og.svg -> public/images/og.png.
 *
 * Why not next/og: `ImageResponse` in Next 14 mis-joins `import.meta.url` with
 * path.join, which throws "Invalid URL" on Windows. A pre-rendered PNG also
 * costs nothing at build time and ships identically in a static export.
 *
 * Run with `npm run og` after editing the SVG.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const src = path.join(root, 'public/images/og.svg');
const out = path.join(root, 'public/images/og.png');

const svg = await readFile(src);
const png = await sharp(svg, { density: 144 }).resize(1200, 630).png({ quality: 90 }).toBuffer();
await writeFile(out, png);

console.log(`og.png written — ${(png.length / 1024).toFixed(1)} kB`);
