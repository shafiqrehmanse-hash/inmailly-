import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  buildOfferBodyParagraphs,
  formatLetterDate,
  formatPkr,
  type OfferLetterForm,
} from "@/lib/offer-letter";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ink = rgb(0.12, 0.12, 0.14);
const muted = rgb(0.4, 0.4, 0.45);
const cyan = rgb(0.13, 0.83, 0.93);
const violet = rgb(0.55, 0.36, 0.96);
const headerBg = rgb(0.05, 0.06, 0.12);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  text: string
): number {
  const lines = text.includes("\n")
    ? text.split("\n").flatMap((p) => (p.trim() ? wrapText(p, font, size, maxWidth) : [""]))
    : wrapText(text, font, size, maxWidth);

  let cy = y;
  for (const line of lines) {
    if (line === "") {
      cy -= lineHeight * 0.6;
      continue;
    }
    page.drawText(line, { x, y: cy, size, font, color });
    cy -= lineHeight;
  }
  return cy;
}

export async function generateOfferLetterPdf(form: OfferLetterForm): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Offer Letter — ${form.candidateName}`);
  doc.setAuthor(form.signerName);
  doc.setSubject(`Employment offer — ${form.roleTitle}`);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_H - 88, width: PAGE_W, height: 88, color: headerBg });
  page.drawRectangle({ x: 0, y: PAGE_H - 91, width: PAGE_W, height: 3, color: cyan });
  page.drawText("I", {
    x: MARGIN,
    y: PAGE_H - 58,
    size: 22,
    font: bold,
    color: cyan,
  });
  page.drawText("InMailly", {
    x: MARGIN + 28,
    y: PAGE_H - 52,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("OFFER OF EMPLOYMENT", {
    x: MARGIN,
    y: PAGE_H - 72,
    size: 8,
    font,
    color: violet,
  });
  page.drawText(`Ref: ${form.referenceNo}`, {
    x: PAGE_W - MARGIN - bold.widthOfTextAtSize(`Ref: ${form.referenceNo}`, 8),
    y: PAGE_H - 52,
    size: 8,
    font,
    color: rgb(0.7, 0.7, 0.75),
  });
  page.drawText(formatLetterDate(form.letterDate), {
    x: PAGE_W - MARGIN - font.widthOfTextAtSize(formatLetterDate(form.letterDate), 8),
    y: PAGE_H - 64,
    size: 8,
    font,
    color: rgb(0.7, 0.7, 0.75),
  });

  let y = PAGE_H - 120;

  // Candidate block
  page.drawText("To:", { x: MARGIN, y, size: 9, font: bold, color: muted });
  y -= 14;
  y = drawWrapped(page, bold, 11, ink, MARGIN, y, CONTENT_W, 14, form.candidateName || "Candidate");
  if (form.candidateEmail) {
    y = drawWrapped(page, font, 9, muted, MARGIN, y, CONTENT_W, 12, form.candidateEmail);
  }
  if (form.candidateCity) {
    y = drawWrapped(page, font, 9, muted, MARGIN, y, CONTENT_W, 12, form.candidateCity);
  }

  y -= 8;

  // Compensation highlight box
  const boxH = 52;
  page.drawRectangle({
    x: MARGIN,
    y: y - boxH,
    width: CONTENT_W,
    height: boxH,
    color: rgb(0.96, 0.98, 1),
    borderColor: cyan,
    borderWidth: 0.5,
  });
  page.drawText("Monthly salary", { x: MARGIN + 12, y: y - 16, size: 8, font, color: muted });
  page.drawText(formatPkr(form.monthlySalaryPkr), {
    x: MARGIN + 12,
    y: y - 32,
    size: 16,
    font: bold,
    color: ink,
  });
  page.drawText("Commission", { x: MARGIN + 200, y: y - 16, size: 8, font, color: muted });
  const commLines = wrapText(form.commissionText, font, 8, CONTENT_W - 212);
  let commY = y - 28;
  for (const line of commLines.slice(0, 3)) {
    page.drawText(line, { x: MARGIN + 200, y: commY, size: 8, font, color: ink });
    commY -= 10;
  }
  y -= boxH + 16;

  // Body
  const paragraphs = buildOfferBodyParagraphs(form);
  for (const para of paragraphs) {
    if (y < 80) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    const isSection =
      para.endsWith("details") ||
      para === "Compensation" ||
      para === "Additional terms" ||
      para === "Warm regards,";
    const isDear = para.startsWith("Dear ");
    const size = isDear ? 11 : isSection ? 10 : 9.5;
    const useFont = isDear || isSection ? bold : font;
    const color = isSection ? violet : ink;
    const lh = isDear ? 15 : 13;

    if (para === "") {
      y -= 6;
      continue;
    }

    if (para.startsWith("•")) {
      y = drawWrapped(page, font, 9, ink, MARGIN + 8, y, CONTENT_W - 8, 12, para);
    } else if (para === form.signerName || para === form.signerTitle || para === form.companyName) {
      y = drawWrapped(page, font, 9, muted, MARGIN, y, CONTENT_W, 12, para);
    } else {
      y = drawWrapped(page, useFont, size, color, MARGIN, y, CONTENT_W, lh, para);
    }
    y -= 4;
  }

  // Footer on last page
  page.drawLine({
    start: { x: MARGIN, y: 48 },
    end: { x: PAGE_W - MARGIN, y: 48 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.88),
  });
  page.drawText("InMailly · Managed LinkedIn outreach infrastructure · inmailly.com", {
    x: MARGIN,
    y: 34,
    size: 7,
    font,
    color: muted,
  });
  page.drawText("Confidential — for intended recipient only", {
    x: PAGE_W - MARGIN - font.widthOfTextAtSize("Confidential — for intended recipient only", 7),
    y: 34,
    size: 7,
    font,
    color: muted,
  });

  return doc.save();
}

export function offerLetterFilename(form: OfferLetterForm) {
  const slug = (form.candidateName || "candidate").replace(/[^\w]+/g, "-").slice(0, 40);
  return `InMailly-Offer-Letter-${slug}.pdf`;
}
