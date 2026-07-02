import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  buildClientServiceBodyParagraphs,
  formatLetterDate,
  formatUsd,
  formatInmailCount,
  type ClientServiceAgreementForm,
} from "@/lib/client-service-agreement";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ink = rgb(0.12, 0.12, 0.14);
const muted = rgb(0.4, 0.4, 0.45);
const cyan = rgb(0.13, 0.83, 0.93);
const violet = rgb(0.55, 0.36, 0.96);
const headerBg = rgb(0.05, 0.06, 0.12);

const SECTION_HEADERS = new Set([
  "Parties",
  "Campaign scope",
  "Investment",
  "Deliverables",
  "Payment terms",
  "Client dashboard & transparency",
  "Confidentiality",
  "Data ownership",
  "Refund & service end",
  "Service terms — important",
  "Additional terms",
  "Electronic acceptance",
]);

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

export async function generateClientServiceAgreementPdf(
  form: ClientServiceAgreementForm,
  opts?: { signaturePngBase64?: string; signedAt?: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Service Agreement — ${form.clientCompany || form.contactName}`);
  doc.setAuthor(form.signerName);
  doc.setSubject(`InMail package — ${form.packageName}`);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);

  page.drawRectangle({ x: 0, y: PAGE_H - 88, width: PAGE_W, height: 88, color: headerBg });
  page.drawRectangle({ x: 0, y: PAGE_H - 91, width: PAGE_W, height: 3, color: cyan });
  page.drawText("I", { x: MARGIN, y: PAGE_H - 58, size: 22, font: bold, color: cyan });
  page.drawText("InMailly", { x: MARGIN + 28, y: PAGE_H - 52, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("CLIENT SERVICE AGREEMENT", {
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

  page.drawText("Client:", { x: MARGIN, y, size: 9, font: bold, color: muted });
  y -= 14;
  y = drawWrapped(page, bold, 11, ink, MARGIN, y, CONTENT_W, 14, form.clientCompany || form.contactName);
  y = drawWrapped(page, font, 9, muted, MARGIN, y, CONTENT_W, 12, `${form.contactName} · ${form.contactEmail}`);
  y -= 8;

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
  page.drawText(`${form.packageName} package`, { x: MARGIN + 12, y: y - 16, size: 8, font, color: muted });
  page.drawText(`${formatInmailCount(form.inmailPackageSize)} InMails`, {
    x: MARGIN + 12,
    y: y - 32,
    size: 16,
    font: bold,
    color: ink,
  });
  const priceLabel =
    parseFloat(form.packagePriceUsd) === 0 ? "Complimentary" : formatUsd(form.packagePriceUsd);
  page.drawText("Investment", { x: MARGIN + 200, y: y - 16, size: 8, font, color: muted });
  page.drawText(priceLabel, { x: MARGIN + 200, y: y - 32, size: 14, font: bold, color: ink });
  page.drawText(form.projectName || "Campaign", {
    x: MARGIN + 200,
    y: y - 46,
    size: 8,
    font,
    color: muted,
  });
  y -= boxH + 16;

  const paragraphs = buildClientServiceBodyParagraphs(form);
  for (const para of paragraphs) {
    if (y < 80) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    const isSection = SECTION_HEADERS.has(para);
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
    } else if (para === form.signerName || para === form.signerTitle || para === form.providerName) {
      y = drawWrapped(page, font, 9, muted, MARGIN, y, CONTENT_W, 12, para);
    } else {
      y = drawWrapped(page, useFont, size, color, MARGIN, y, CONTENT_W, lh, para);
    }
    y -= 4;
  }

  if (opts?.signaturePngBase64) {
    if (y < 140) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    y -= 12;
    page.drawText("Client acceptance", { x: MARGIN, y, size: 9, font: bold, color: violet });
    y -= 14;
    try {
      const pngBytes = Uint8Array.from(
        Buffer.from(opts.signaturePngBase64.replace(/^data:image\/png;base64,/, ""), "base64")
      );
      const png = await doc.embedPng(pngBytes);
      const sigW = 160;
      const sigH = (png.height / png.width) * sigW;
      page.drawImage(png, { x: MARGIN, y: y - sigH, width: sigW, height: sigH });
      y -= sigH + 8;
    } catch {
      page.drawText("[Signature on file]", { x: MARGIN, y, size: 9, font, color: ink });
      y -= 14;
    }
    page.drawText(form.contactName, { x: MARGIN, y, size: 9, font: bold, color: ink });
    y -= 12;
    if (opts.signedAt) {
      page.drawText(`Signed electronically: ${formatLetterDate(opts.signedAt.slice(0, 10))}`, {
        x: MARGIN,
        y,
        size: 8,
        font,
        color: muted,
      });
    }
  }

  page.drawLine({
    start: { x: MARGIN, y: 48 },
    end: { x: PAGE_W - MARGIN, y: 48 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.88),
  });
  page.drawText("InMailly · Managed LinkedIn outreach · inmailly.com", {
    x: MARGIN,
    y: 34,
    size: 7,
    font,
    color: muted,
  });

  return doc.save();
}

export function clientServiceAgreementFilename(form: ClientServiceAgreementForm) {
  const slug = (form.clientCompany || form.contactName || "client").replace(/[^\w]+/g, "-").slice(0, 40);
  return `InMailly-Service-Agreement-${slug}.pdf`;
}
