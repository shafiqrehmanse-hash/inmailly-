import sharp from "sharp";
import {
  completeOpenAiVisionJson,
  validateScreenshotDataUrl,
} from "@/lib/openai-vision";
import type { CropRegion } from "@/lib/proof-crop";

export type LinkedInProfileExtract = {
  display_name: string;
  headline: string;
  title: string;
  linkedin_url: string | null;
  profile_photo_data: string;
  cover_photo_data: string;
  card_preview_data: string;
};

type RegionPct = {
  left_pct: number;
  top_pct: number;
  width_pct: number;
  height_pct: number;
};

type VisionProfileJson = {
  display_name?: string;
  headline?: string;
  title?: string;
  linkedin_url?: string | null;
  profile_panel?: RegionPct;
  profile_photo?: RegionPct;
  cover_photo?: RegionPct;
};

const PROFILE_SYSTEM = `You analyze LinkedIn profile page screenshots (desktop or mobile).

Return JSON only:
- display_name: person's full name as shown on the profile
- headline: headline line under their name
- title: current job title if shown separately from headline
- linkedin_url: profile URL if visible in the address bar or page, else null
- profile_panel: bounding box of ONLY the profile header card (cover banner + circular avatar + name area). Exclude browser chrome, LinkedIn left sidebar, ads, and feed. Percentages 0-100 of the full screenshot: left_pct, top_pct, width_pct, height_pct
- profile_photo: bounding box of the circular profile avatar photo ONLY (must contain the person's face/photo, not empty UI). Percentages of the FULL screenshot.
- cover_photo: bounding box of the banner/cover image at top of profile (photo/graphic, not solid black/white bars). Percentages of the FULL screenshot.

LinkedIn layout hints:
- Cover banner is full width of profile card, ~15-22% of card height
- Avatar is a circle overlapping the cover's bottom-left, ~12-16% of card width
- On wide desktop screenshots the profile card is usually center-left (not the entire screen)`;

function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/[\w+.-]+;base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[1], "base64");
}

function bufferToJpegDataUrl(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function clampPct(n: unknown, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(100, v));
}

function regionToPixels(region: RegionPct, width: number, height: number): CropRegion {
  const left = Math.round((clampPct(region.left_pct, 0) / 100) * width);
  const top = Math.round((clampPct(region.top_pct, 0) / 100) * height);
  const w = Math.max(12, Math.round((clampPct(region.width_pct, 12) / 100) * width));
  const h = Math.max(12, Math.round((clampPct(region.height_pct, 12) / 100) * height));
  return {
    left: Math.min(left, Math.max(0, width - 12)),
    top: Math.min(top, Math.max(0, height - 12)),
    width: Math.min(w, width - left),
    height: Math.min(h, height - top),
  };
}

function isValidRegion(region: RegionPct): boolean {
  return (
    clampPct(region.width_pct, 0) >= 5 &&
    clampPct(region.height_pct, 0) >= 5 &&
    clampPct(region.left_pct, 0) + clampPct(region.width_pct, 0) <= 101 &&
    clampPct(region.top_pct, 0) + clampPct(region.height_pct, 0) <= 101
  );
}

/** Wide desktop Print Screen — crop toward LinkedIn profile column. */
function heuristicProfilePanelCrop(width: number, height: number): CropRegion {
  const aspect = width / height;
  if (aspect <= 1.35) {
    return { left: 0, top: 0, width, height };
  }

  const left = Math.round(width * (aspect > 1.8 ? 0.2 : 0.12));
  const top = Math.round(height * 0.06);
  const w = Math.round(width * (aspect > 1.8 ? 0.42 : 0.55));
  const h = Math.round(height * 0.52);

  return {
    left: Math.min(left, width - 200),
    top: Math.min(top, height - 200),
    width: Math.min(w, width - left),
    height: Math.min(h, height - top),
  };
}

/** LinkedIn profile header uses a stable layout inside the profile card. */
function linkedInHeaderRegions(width: number, height: number): { cover: CropRegion; profile: CropRegion } {
  const coverHeight = Math.max(40, Math.round(height * 0.2));
  const avatarSize = Math.max(48, Math.round(Math.min(width, height) * 0.155));
  const avatarLeft = Math.round(width * 0.045);
  const avatarTop = Math.max(0, Math.round(height * 0.12));

  return {
    cover: { left: 0, top: 0, width, height: Math.min(coverHeight, height) },
    profile: {
      left: Math.min(avatarLeft, Math.max(0, width - avatarSize)),
      top: Math.min(avatarTop, Math.max(0, height - avatarSize)),
      width: Math.min(avatarSize, width),
      height: Math.min(avatarSize, height),
    },
  };
}

function squareRegion(region: CropRegion): CropRegion {
  const size = Math.min(region.width, region.height);
  return {
    left: region.left + Math.round((region.width - size) / 2),
    top: region.top + Math.round((region.height - size) / 2),
    width: size,
    height: size,
  };
}

async function normalizeScreenshot(input: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width || 1200, height: meta.height || 800 };
}

async function extractRegion(input: Buffer, region: CropRegion): Promise<Buffer> {
  return sharp(input, { failOn: "none" }).rotate().extract(region).toBuffer();
}

async function cropToJpegDataUrl(input: Buffer, region: CropRegion, size: { w: number; h: number }) {
  const square = region.width === region.height ? region : squareRegion(region);
  const buf = await sharp(input, { failOn: "none" })
    .rotate()
    .extract(square)
    .resize(size.w, size.h, { fit: "cover", position: "attention" })
    .sharpen({ sigma: 0.4 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return bufferToJpegDataUrl(buf);
}

async function regionColorVariance(input: Buffer, region: CropRegion): Promise<number> {
  try {
    const { data, info } = await sharp(input, { failOn: "none" })
      .rotate()
      .extract(region)
      .resize(24, 24, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.channels < 3) return 0;
    let sum = 0;
    let sumSq = 0;
    const pixels = data.length / info.channels;
    for (let i = 0; i < data.length; i += info.channels) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
    }
    const mean = sum / pixels;
    return sumSq / pixels - mean * mean;
  } catch {
    return 0;
  }
}

async function buildCardPreview(
  coverData: string,
  profileData: string,
  name: string,
  headline: string
): Promise<string> {
  const cardW = 360;
  const cardH = 200;
  const coverH = 80;
  const avatarSize = 64;

  const coverBuf = dataUrlToBuffer(coverData);
  const profileBuf = dataUrlToBuffer(profileData);

  const coverStrip = await sharp(coverBuf)
    .resize(cardW, coverH, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88 })
    .toBuffer();

  const avatarMask = Buffer.from(
    `<svg width="${avatarSize}" height="${avatarSize}"><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/></svg>`
  );

  const avatar = await sharp(profileBuf)
    .resize(avatarSize, avatarSize, { fit: "cover", position: "attention" })
    .composite([{ input: avatarMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const textSvg = `
    <svg width="${cardW}" height="${cardH - coverH + 24}">
      <style>
        .name { fill: #f4f4f5; font: 700 15px sans-serif; }
        .headline { fill: #a1a1aa; font: 500 11px sans-serif; }
      </style>
      <text x="84" y="30" class="name">${escapeXml(name.slice(0, 38))}</text>
      <text x="84" y="50" class="headline">${escapeXml(headline.slice(0, 52))}</text>
    </svg>`;

  const card = await sharp({
    create: {
      width: cardW,
      height: cardH,
      channels: 3,
      background: { r: 11, g: 14, b: 34 },
    },
  })
    .composite([
      { input: coverStrip, top: 0, left: 0 },
      { input: avatar, top: coverH - 32, left: 16 },
      { input: Buffer.from(textSvg), top: coverH - 10, left: 0 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return bufferToJpegDataUrl(card);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function pickPhotoRegions(
  panelBuffer: Buffer,
  panelW: number,
  panelH: number,
  vision: VisionProfileJson,
  fullW: number,
  fullH: number,
  panelCrop: CropRegion
): Promise<{ cover: CropRegion; profile: CropRegion }> {
  const layout = linkedInHeaderRegions(panelW, panelH);

  let cover = layout.cover;
  let profile = layout.profile;

  const toPanelCoords = (region: CropRegion): CropRegion => ({
    left: region.left - panelCrop.left,
    top: region.top - panelCrop.top,
    width: region.width,
    height: region.height,
  });

  if (vision.cover_photo && isValidRegion(vision.cover_photo)) {
    const vCover = toPanelCoords(regionToPixels(vision.cover_photo, fullW, fullH));
    if (vCover.left >= -8 && vCover.top >= -8 && vCover.width >= 20) {
      const variance = await regionColorVariance(panelBuffer, {
        left: Math.max(0, vCover.left),
        top: Math.max(0, vCover.top),
        width: Math.min(vCover.width, panelW),
        height: Math.min(Math.max(vCover.height, layout.cover.height), panelH),
      });
      if (variance > 120) {
        cover = {
          left: 0,
          top: 0,
          width: panelW,
          height: Math.max(layout.cover.height, Math.min(vCover.height, Math.round(panelH * 0.28))),
        };
      }
    }
  }

  if (vision.profile_photo && isValidRegion(vision.profile_photo)) {
    const vProfile = toPanelCoords(squareRegion(regionToPixels(vision.profile_photo, fullW, fullH)));
    if (vProfile.left >= -8 && vProfile.top >= 0 && vProfile.width >= 24) {
      const clamped: CropRegion = {
        left: Math.max(0, Math.min(vProfile.left, panelW - 24)),
        top: Math.max(0, Math.min(vProfile.top, panelH - 24)),
        width: Math.min(vProfile.width, panelW),
        height: Math.min(vProfile.height, panelH),
      };
      const variance = await regionColorVariance(panelBuffer, squareRegion(clamped));
      if (variance > 80) profile = squareRegion(clamped);
    }
  }

  return { cover, profile };
}

export async function extractLinkedInProfileFromScreenshot(
  imageDataUrl: string
): Promise<LinkedInProfileExtract> {
  const imageError = validateScreenshotDataUrl(imageDataUrl);
  if (imageError) throw new Error(imageError);

  const rawInput = dataUrlToBuffer(imageDataUrl);
  const { buffer: normalized, width: fullW, height: fullH } = await normalizeScreenshot(rawInput);

  const visionImageUrl = bufferToJpegDataUrl(normalized);

  const raw = await completeOpenAiVisionJson<VisionProfileJson>({
    systemPrompt: PROFILE_SYSTEM,
    userText: `Screenshot size: ${fullW}x${fullH}px. Extract profile text and crop regions. Return valid JSON only.`,
    imageDataUrl: visionImageUrl,
    temperature: 0.15,
    maxTokens: 650,
    logLabel: "linkedin-profile-extract",
  });

  const display_name = (raw.display_name || "LinkedIn Profile").trim().slice(0, 120);
  const headline = (raw.headline || raw.title || "").trim().slice(0, 220);
  const title = (raw.title || raw.headline || "").trim().slice(0, 220);
  const linkedin_url =
    typeof raw.linkedin_url === "string" && raw.linkedin_url.startsWith("http")
      ? raw.linkedin_url.trim().slice(0, 500)
      : null;

  let panelCrop =
    raw.profile_panel && isValidRegion(raw.profile_panel)
      ? regionToPixels(raw.profile_panel, fullW, fullH)
      : heuristicProfilePanelCrop(fullW, fullH);

  panelCrop = {
    ...panelCrop,
    width: Math.min(panelCrop.width, fullW - panelCrop.left),
    height: Math.min(panelCrop.height, fullH - panelCrop.top),
  };

  const panelBuffer = await extractRegion(normalized, panelCrop);
  const panelMeta = await sharp(panelBuffer).metadata();
  const panelW = panelMeta.width || panelCrop.width;
  const panelH = panelMeta.height || panelCrop.height;

  const { cover, profile } = await pickPhotoRegions(
    panelBuffer,
    panelW,
    panelH,
    raw,
    fullW,
    fullH,
    panelCrop
  );

  const coverRegionOnPanel = {
    left: 0,
    top: 0,
    width: panelW,
    height: Math.min(cover.height, panelH),
  };

  const profileRegionOnPanel = squareRegion({
    left: Math.max(0, Math.min(profile.left, panelW - 48)),
    top: Math.max(0, Math.min(profile.top, panelH - 48)),
    width: Math.min(profile.width, panelW),
    height: Math.min(profile.height, panelH),
  });

  const cover_photo_data = await cropToJpegDataUrl(panelBuffer, coverRegionOnPanel, { w: 480, h: 120 });
  const profile_photo_data = await cropToJpegDataUrl(panelBuffer, squareRegion(profileRegionOnPanel), {
    w: 128,
    h: 128,
  });
  const card_preview_data = await buildCardPreview(
    cover_photo_data,
    profile_photo_data,
    display_name,
    headline || title
  );

  return {
    display_name,
    headline,
    title,
    linkedin_url,
    profile_photo_data,
    cover_photo_data,
    card_preview_data,
  };
}
