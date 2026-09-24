import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { CaseStudyImage, ProjectCaseStudy } from "@/lib/case-study";
import { caseStudyFilename } from "@/lib/case-study";

export { caseStudyFilename };

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ink = rgb(0.1, 0.11, 0.14);
const muted = rgb(0.42, 0.43, 0.48);
const white = rgb(1, 1, 1);
const cyan = rgb(0.13, 0.83, 0.93);
const violet = rgb(0.55, 0.36, 0.96);
const headerBg = rgb(0.05, 0.06, 0.12);
const cardBg = rgb(0.96, 0.97, 0.99);
const line = rgb(0.88, 0.89, 0.92);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

async function embedImage(doc: PDFDocument, img: CaseStudyImage): Promise<PDFImage | null> {
  try {
    return img.kind === "png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
  } catch {
    try {
      return img.kind === "png" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    } catch {
      return null;
    }
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function generateProjectCaseStudyPdf(data: ProjectCaseStudy): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Case Study — ${data.companyName}`);
  doc.setAuthor("InMailly");
  doc.setSubject(`${data.projectName} LinkedIn InMail campaign results`);
  doc.setCreationDate(new Date(data.generatedAt));

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logo = data.logo ? await embedImage(doc, data.logo) : null;
  const proofImages: PDFImage[] = [];
  for (const p of data.proofs) {
    const embedded = await embedImage(doc, p);
    if (embedded) proofImages.push(embedded);
  }

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let pageIndex = 1;

  const drawHeader = (p: PDFPage, subtitle: string) => {
    p.drawRectangle({ x: 0, y: PAGE_H - 78, width: PAGE_W, height: 78, color: headerBg });
    p.drawRectangle({ x: 0, y: PAGE_H - 81, width: PAGE_W, height: 3, color: cyan });
    p.drawText("InMailly", { x: MARGIN, y: PAGE_H - 42, size: 16, font: bold, color: white });
    p.drawText("CAMPAIGN CASE STUDY", {
      x: MARGIN,
      y: PAGE_H - 58,
      size: 8,
      font,
      color: violet,
    });
    const subW = font.widthOfTextAtSize(subtitle, 8);
    p.drawText(subtitle, {
      x: PAGE_W - MARGIN - subW,
      y: PAGE_H - 42,
      size: 8,
      font,
      color: rgb(0.72, 0.73, 0.78),
    });
    p.drawText(formatDate(data.generatedAt), {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(formatDate(data.generatedAt), 8),
      y: PAGE_H - 56,
      size: 8,
      font,
      color: rgb(0.72, 0.73, 0.78),
    });
  };

  const drawFooter = (p: PDFPage, n: number) => {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 28, color: headerBg });
    p.drawText("Confidential · Prepared by InMailly", {
      x: MARGIN,
      y: 11,
      size: 7,
      font,
      color: rgb(0.7, 0.72, 0.78),
    });
    const label = `Page ${n}`;
    p.drawText(label, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(label, 7),
      y: 11,
      size: 7,
      font,
      color: rgb(0.7, 0.72, 0.78),
    });
  };

  const ensureSpace = (needed: number, y: number, title: string): { page: PDFPage; y: number } => {
    if (y - needed > 40) return { page, y };
    drawFooter(page, pageIndex);
    page = doc.addPage([PAGE_W, PAGE_H]);
    pageIndex += 1;
    drawHeader(page, title);
    return { page, y: PAGE_H - 100 };
  };

  drawHeader(page, data.companyName);
  drawFooter(page, pageIndex);

  let y = PAGE_H - 108;

  if (logo) {
    const maxH = 36;
    const maxW = 120;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    page.drawImage(logo, { x: MARGIN, y: y - h + 8, width: w, height: h });
    y -= h + 10;
  }

  page.drawText(data.companyName, { x: MARGIN, y, size: 22, font: bold, color: ink });
  y -= 22;
  page.drawText(data.projectName, { x: MARGIN, y, size: 12, font, color: muted });
  y -= 16;
  page.drawText(`Status: ${data.status} · Contact: ${data.contactName}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: muted,
  });
  y -= 28;

  page.drawText("Results snapshot", { x: MARGIN, y, size: 11, font: bold, color: ink });
  y -= 14;

  const metrics: { label: string; value: string }[] = [
    { label: "InMails sent", value: data.stats.sends.toLocaleString() },
    { label: "Responses", value: data.stats.total.toLocaleString() },
    { label: "Hot leads", value: data.stats.interested.toLocaleString() },
    { label: "Reply rate", value: `${data.replyRate}%` },
  ];
  if (data.packageSize && data.packageSize > 0) {
    metrics.push({
      label: "Package",
      value: `${Math.round(data.packagePercent)}% of ${data.packageSize.toLocaleString()}`,
    });
  }

  const boxW = (CONTENT_W - 16) / 2;
  const boxH = 48;
  for (let i = 0; i < metrics.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN + col * (boxW + 16);
    const by = y - row * (boxH + 10) - boxH;
    page.drawRectangle({
      x,
      y: by,
      width: boxW,
      height: boxH,
      color: cardBg,
      borderColor: line,
      borderWidth: 0.6,
    });
    page.drawText(metrics[i].label.toUpperCase(), {
      x: x + 12,
      y: by + 30,
      size: 7,
      font,
      color: muted,
    });
    page.drawText(metrics[i].value, {
      x: x + 12,
      y: by + 12,
      size: 16,
      font: bold,
      color: ink,
    });
  }
  const metricRows = Math.ceil(metrics.length / 2);
  y -= metricRows * (boxH + 10) + 18;

  const section = (title: string) => {
    const next = ensureSpace(40, y, data.companyName);
    page = next.page;
    y = next.y;
    page.drawText(title, { x: MARGIN, y, size: 11, font: bold, color: ink });
    y -= 6;
    page.drawRectangle({ x: MARGIN, y, width: 36, height: 2, color: cyan });
    y -= 16;
  };

  if (data.audienceBrief || data.targetTitles || data.targetIndustries || data.targetRegions) {
    section("Audience & brief");
    const bits = [
      data.targetTitles ? `Titles: ${data.targetTitles}` : "",
      data.targetIndustries ? `Industries: ${data.targetIndustries}` : "",
      data.targetRegions ? `Regions: ${data.targetRegions}` : "",
    ].filter(Boolean);
    for (const bit of bits) {
      const lines = wrapText(bit, font, 9, CONTENT_W);
      const needed = lines.length * 12 + 4;
      const next = ensureSpace(needed, y, data.companyName);
      page = next.page;
      y = next.y;
      for (const ln of lines) {
        page.drawText(ln, { x: MARGIN, y, size: 9, font, color: ink });
        y -= 12;
      }
      y -= 4;
    }
    if (data.audienceBrief) {
      const lines = wrapText(data.audienceBrief.replace(/\s+/g, " ").trim(), font, 9, CONTENT_W);
      for (const ln of lines.slice(0, 18)) {
        const next = ensureSpace(14, y, data.companyName);
        page = next.page;
        y = next.y;
        page.drawText(ln, { x: MARGIN, y, size: 9, font, color: muted });
        y -= 12;
      }
      y -= 8;
    }
  }

  if (data.inmailSubject) {
    section("Campaign message");
    const lines = wrapText(`Subject: ${data.inmailSubject}`, font, 9, CONTENT_W);
    for (const ln of lines) {
      page.drawText(ln, { x: MARGIN, y, size: 9, font, color: ink });
      y -= 12;
    }
    y -= 8;
  }

  if (data.profiles.length) {
    section("Sender profiles");
    for (const profile of data.profiles) {
      const next = ensureSpace(32, y, data.companyName);
      page = next.page;
      y = next.y;
      page.drawText(profile.name, { x: MARGIN, y, size: 10, font: bold, color: ink });
      y -= 13;
      const sub = [profile.title, profile.headline].filter(Boolean).join(" · ");
      if (sub) {
        const lines = wrapText(sub, font, 8, CONTENT_W);
        for (const ln of lines.slice(0, 2)) {
          page.drawText(ln, { x: MARGIN, y, size: 8, font, color: muted });
          y -= 11;
        }
      }
      y -= 8;
    }
  }

  if (data.sampleLeads.length) {
    section("Response highlights");
    page.drawText("Name", { x: MARGIN, y, size: 7, font: bold, color: muted });
    page.drawText("Role / company", { x: MARGIN + 150, y, size: 7, font: bold, color: muted });
    page.drawText("Status", { x: PAGE_W - MARGIN - 70, y, size: 7, font: bold, color: muted });
    y -= 12;
    for (const lead of data.sampleLeads) {
      const next = ensureSpace(16, y, data.companyName);
      page = next.page;
      y = next.y;
      page.drawText((lead.name || "—").slice(0, 28), { x: MARGIN, y, size: 8, font, color: ink });
      const role = [lead.position, lead.company].filter(Boolean).join(" · ") || "—";
      page.drawText(role.slice(0, 42), { x: MARGIN + 150, y, size: 8, font, color: muted });
      page.drawText((lead.status || "").replace("_", " "), {
        x: PAGE_W - MARGIN - 70,
        y,
        size: 8,
        font,
        color: ink,
      });
      y -= 14;
    }
    y -= 6;
  }

  if (proofImages.length) {
    section("Send proof screenshots");
    page.drawText(
      `Verified InMail send proofs from the live campaign (${proofImages.length} of ${data.proofTotal.toLocaleString()} shown).`,
      { x: MARGIN, y, size: 8, font, color: muted }
    );
    y -= 16;

    const gap = 10;
    const imgW = (CONTENT_W - gap) / 2;
    const imgH = 168;

    for (let i = 0; i < proofImages.length; i++) {
      const col = i % 2;
      if (col === 0) {
        const next = ensureSpace(imgH + 16, y, data.companyName);
        page = next.page;
        y = next.y;
      }
      const img = proofImages[i];
      const x = MARGIN + col * (imgW + gap);
      const scale = Math.min(imgW / img.width, imgH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const boxY = y - imgH;
      page.drawRectangle({
        x,
        y: boxY,
        width: imgW,
        height: imgH,
        color: rgb(0.07, 0.08, 0.12),
        borderColor: line,
        borderWidth: 0.5,
      });
      page.drawImage(img, {
        x: x + (imgW - w) / 2,
        y: boxY + (imgH - h) / 2,
        width: w,
        height: h,
      });
      if (col === 1 || i === proofImages.length - 1) {
        y -= imgH + 12;
      }
    }
  } else {
    section("Send proof screenshots");
    page.drawText("No client-visible send proofs have been uploaded for this project yet.", {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: muted,
    });
    y -= 16;
  }

  const close = ensureSpace(40, y, data.companyName);
  page = close.page;
  y = close.y;
  page.drawText("Prepared by InMailly for internal and client case-study use.", {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: muted,
  });

  drawFooter(page, pageIndex);
  return doc.save();
}
