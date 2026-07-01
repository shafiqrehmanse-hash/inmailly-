import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

export async function generateTerminationNoticePdf(noticeBody: string, referenceNo: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 60;

  page.drawRectangle({ x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: rgb(0.05, 0.06, 0.12) });
  page.drawText("InMailly — Termination Notice", { x: MARGIN, y: PAGE_H - 42, size: 14, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Ref: ${referenceNo}`, { x: MARGIN, y: PAGE_H - 58, size: 8, font, color: rgb(0.7, 0.7, 0.75) });

  const lines = noticeBody.split("\n");
  for (const line of lines) {
    if (y < 60) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    const isTitle = line === "TERMINATION NOTICE" || line === "Summary";
    page.drawText(line || " ", {
      x: MARGIN,
      y,
      size: isTitle ? 11 : 9.5,
      font: isTitle ? bold : font,
      color: rgb(0.15, 0.15, 0.18),
    });
    y -= line.startsWith("•") ? 14 : line === "" ? 8 : 13;
  }

  return doc.save();
}

export function terminationNoticeFilename(name: string) {
  return `InMailly-Termination-${name.replace(/[^\w]+/g, "-").slice(0, 40)}.pdf`;
}
