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
  profile_photo?: RegionPct;
  cover_photo?: RegionPct;
};

const PROFILE_SYSTEM = `You analyze LinkedIn profile page screenshots.
Return JSON only with these keys:
- display_name: person's full name as shown
- headline: the headline line under their name (may match title)
- title: current job title / role line if distinct from headline
- linkedin_url: profile URL if visible in the browser bar or page, else null
- profile_photo: bounding box of the circular profile avatar as percentages of image size (0-100): left_pct, top_pct, width_pct, height_pct
- cover_photo: bounding box of the banner/cover image at top as percentages (0-100): left_pct, top_pct, width_pct, height_pct

If unsure about regions, estimate from typical LinkedIn layout: cover is top ~22% full width; avatar is left side below cover ~12% square.`;

function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/[\w+.-]+;base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[1], "base64");
}

function bufferToJpegDataUrl(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function clampPct(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : fallback;
  return Math.max(0, Math.min(100, v));
}

function regionToPixels(region: RegionPct, width: number, height: number): CropRegion {
  const left = Math.round((clampPct(region.left_pct, 0) / 100) * width);
  const top = Math.round((clampPct(region.top_pct, 0) / 100) * height);
  const w = Math.max(8, Math.round((clampPct(region.width_pct, 12) / 100) * width));
  const h = Math.max(8, Math.round((clampPct(region.height_pct, 12) / 100) * height));
  return {
    left: Math.min(left, Math.max(0, width - 8)),
    top: Math.min(top, Math.max(0, height - 8)),
    width: Math.min(w, width - left),
    height: Math.min(h, height - top),
  };
}

function defaultCoverRegion(): RegionPct {
  return { left_pct: 0, top_pct: 0, width_pct: 100, height_pct: 22 };
}

function defaultProfileRegion(): RegionPct {
  return { left_pct: 3, top_pct: 14, width_pct: 14, height_pct: 14 };
}

async function cropToJpegDataUrl(input: Buffer, region: CropRegion, size: { w: number; h: number }) {
  const buf = await sharp(input, { failOn: "none" })
    .rotate()
    .extract(region)
    .resize(size.w, size.h, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return bufferToJpegDataUrl(buf);
}

async function buildCardPreview(
  input: Buffer,
  coverData: string,
  profileData: string,
  name: string,
  headline: string
): Promise<string> {
  const cardW = 360;
  const cardH = 200;
  const coverH = 72;
  const avatarSize = 56;

  const coverBuf = dataUrlToBuffer(coverData);
  const profileBuf = dataUrlToBuffer(profileData);

  const coverStrip = await sharp(coverBuf)
    .resize(cardW, coverH, { fit: "cover" })
    .toBuffer();

  const avatar = await sharp(profileBuf)
    .resize(avatarSize, avatarSize, { fit: "cover" })
    .png()
    .toBuffer();

  const textSvg = `
    <svg width="${cardW}" height="${cardH - coverH + 20}">
      <style>
        .name { fill: #f4f4f5; font: 700 15px sans-serif; }
        .headline { fill: #a1a1aa; font: 500 11px sans-serif; }
      </style>
      <text x="78" y="28" class="name">${escapeXml(name.slice(0, 40))}</text>
      <text x="78" y="48" class="headline">${escapeXml(headline.slice(0, 55))}</text>
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
      { input: avatar, top: coverH - 28, left: 14 },
      { input: Buffer.from(textSvg), top: coverH - 8, left: 0 },
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  return bufferToJpegDataUrl(card);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function extractLinkedInProfileFromScreenshot(
  imageDataUrl: string
): Promise<LinkedInProfileExtract> {
  const imageError = validateScreenshotDataUrl(imageDataUrl);
  if (imageError) throw new Error(imageError);

  const input = dataUrlToBuffer(imageDataUrl);
  const meta = await sharp(input, { failOn: "none" }).rotate().metadata();
  const width = meta.width || 1200;
  const height = meta.height || 800;

  const raw = await completeOpenAiVisionJson<VisionProfileJson>({
    systemPrompt: PROFILE_SYSTEM,
    userText:
      "Extract the LinkedIn profile identity and crop regions from this screenshot. Return valid JSON only.",
    imageDataUrl,
    temperature: 0.2,
    maxTokens: 500,
    logLabel: "linkedin-profile-extract",
  });

  const display_name = (raw.display_name || "LinkedIn Profile").trim().slice(0, 120);
  const headline = (raw.headline || raw.title || "").trim().slice(0, 220);
  const title = (raw.title || raw.headline || "").trim().slice(0, 220);
  const linkedin_url =
    typeof raw.linkedin_url === "string" && raw.linkedin_url.startsWith("http")
      ? raw.linkedin_url.trim().slice(0, 500)
      : null;

  const coverRegion = regionToPixels(raw.cover_photo || defaultCoverRegion(), width, height);
  const profileRegion = regionToPixels(raw.profile_photo || defaultProfileRegion(), width, height);

  const cover_photo_data = await cropToJpegDataUrl(input, coverRegion, { w: 320, h: 80 });
  const profile_photo_data = await cropToJpegDataUrl(input, profileRegion, { w: 96, h: 96 });
  const card_preview_data = await buildCardPreview(
    input,
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
