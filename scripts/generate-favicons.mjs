import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const appDir = path.join(root, "app");

function brandMarkSvgSquare(size = 64, background = "#050a12") {
  const padX = (size - 48 * (size / 64)) / 2;
  const padY = (size - 56 * (size / 64)) / 2;
  const scale = size / 64;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${background}"/>
  <g transform="translate(${padX} ${padY}) scale(${scale})">
    <circle cx="24" cy="17" r="20.5" stroke="#1e4d5c" stroke-width="0.55" opacity="0.45" fill="none"/>
    <circle cx="24" cy="17" r="15.5" stroke="#1e5a6e" stroke-width="0.6" opacity="0.55" fill="none"/>
    <circle cx="24" cy="17" r="10.5" stroke="#2a7a8f" stroke-width="0.65" opacity="0.65" fill="none"/>
    <defs>
      <radialGradient id="orb" cx="32%" cy="28%" r="68%">
        <stop offset="0%" stop-color="#a5f3fc"/>
        <stop offset="45%" stop-color="#22d3ee"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </radialGradient>
    </defs>
    <circle cx="24" cy="17" r="7.2" fill="url(#orb)"/>
    <circle cx="21.2" cy="14.2" r="1.35" fill="white" opacity="0.85"/>
    <rect x="18.75" y="31" width="10.5" height="22" rx="5.25" fill="white"/>
  </g>
</svg>`;
}

async function writePng(size, filename) {
  const svg = brandMarkSvgSquare(Math.max(size, 64));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, filename), buf);
  return buf;
}

async function main() {
  fs.mkdirSync(publicDir, { recursive: true });

  await writePng(16, "favicon-16.png");
  await writePng(32, "favicon-32.png");
  await writePng(48, "favicon-48.png");
  const icon512 = await writePng(512, "icon.png");
  const apple = await writePng(180, "apple-icon.png");
  const fav32 = fs.readFileSync(path.join(publicDir, "favicon-32.png"));

  fs.writeFileSync(path.join(publicDir, "favicon.ico"), fav32);
  fs.writeFileSync(path.join(appDir, "icon.png"), icon512);
  fs.writeFileSync(path.join(appDir, "apple-icon.png"), apple);
  fs.writeFileSync(path.join(appDir, "favicon.ico"), fav32);

  console.log("Favicons generated in public/ and app/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
