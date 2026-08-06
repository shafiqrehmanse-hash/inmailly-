import { OPENAI_VISION_MAX_IMAGE_CHARS } from "@/lib/openai-vision";

export const MAX_SCREENSHOT_DATA_URL_CHARS = OPENAI_VISION_MAX_IMAGE_CHARS;

/** Shrink huge Print Screens so they fit API limits. */
export async function normalizeScreenshotDataUrl(dataUrl: string): Promise<string> {
  if (dataUrl.length <= MAX_SCREENSHOT_DATA_URL_CHARS) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process screenshot"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      let out = canvas.toDataURL("image/jpeg", quality);
      while (out.length > MAX_SCREENSHOT_DATA_URL_CHARS && quality > 0.45) {
        quality -= 0.1;
        out = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error("Invalid screenshot image"));
    img.src = dataUrl;
  });
}

export async function fileToScreenshotDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
  return normalizeScreenshotDataUrl(raw);
}
