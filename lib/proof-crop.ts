import sharp from "sharp";

export type CropRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Full Print Screen captures (Sales Navigator + InMail overlay) are cropped to
 * the messaging window area clients should see — similar to a tight InMail modal shot.
 */
export function getInMailCropRegion(width: number, height: number): CropRegion {
  const aspect = width / height;

  // Already a tight InMail / messaging window capture
  if (aspect < 1.9 && width <= 1700) {
    return { left: 0, top: 0, width, height };
  }

  // Full desktop / browser screenshot — crop to right-center InMail overlay
  const left = Math.round(width * 0.27);
  const top = Math.round(height * 0.045);
  const cropW = Math.round(width * 0.71);
  const cropH = Math.round(height * 0.87);

  return {
    left: Math.min(left, Math.max(0, width - 200)),
    top: Math.min(top, Math.max(0, height - 200)),
    width: Math.min(cropW, width - left),
    height: Math.min(cropH, height - top),
  };
}

export async function processProofScreenshot(input: Buffer) {
  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const width = meta.width || 1920;
  const height = meta.height || 1080;

  const original = await sharp(input)
    .rotate()
    .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  const crop = getInMailCropRegion(width, height);
  const display = await sharp(input)
    .rotate()
    .extract(crop)
    .resize({ width: 1600, withoutEnlargement: true })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 93, mozjpeg: true })
    .toBuffer();

  return { original, display, width, height };
}
