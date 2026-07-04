import sharp from "sharp";

/** Center-crop to square, face-aware when possible, output crisp 512px JPEG for circular avatars. */
export async function processTeamPhoto(input: Buffer) {
  const image = sharp(input, { failOn: "none", unlimited: true }).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not read image dimensions");
  }

  // High-res master for retina circles (2x–3x display size)
  const avatar = await sharp(input, { failOn: "none", unlimited: true })
    .rotate()
    .resize(512, 512, {
      fit: "cover",
      position: "attention",
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.7, m1: 0.8, m2: 0.4 })
    .jpeg({
      quality: 94,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
      trellisQuantisation: true,
      overshootDeringing: true,
      optimiseScans: true,
    })
    .toBuffer();

  return avatar;
}

export const TEAM_PHOTO_BUCKET = "team-photos";
export const TEAM_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
