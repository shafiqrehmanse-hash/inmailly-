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
const luxBg = rgb(0.02, 0.027, 0.043);
const luxCard = rgb(0.075, 0.102, 0.141);
const luxMuted = rgb(0.616, 0.659, 0.722);
const luxBorder = rgb(0.18, 0.2, 0.26);
const emerald = rgb(0.2, 0.83, 0.6);
const headerBg = rgb(0.05, 0.06, 0.12);
const cardBg = rgb(0.96, 0.97, 0.99);
const line = rgb(0.88, 0.89, 0.92);

function drawDashFooter(p: PDFPage, font: PDFFont, n: number) {
  p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 26, color: rgb(0.027, 0.035, 0.1) });
  p.drawText("InMailly client dashboard  ·  case study capture", {
    x: 28,
    y: 10,
    size: 7,
    font,
    color: luxMuted,
  });
  const label = `Page ${n}`;
  p.drawText(label, {
    x: PAGE_W - 28 - font.widthOfTextAtSize(label, 7),
    y: 10,
    size: 7,
    font,
    color: luxMuted,
  });
}

function drawAppChrome(
  p: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  data: ProjectCaseStudy,
  active: "Campaign" | "Analytics"
) {
  p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: luxBg });
  p.drawRectangle({ x: 0, y: 0, width: 118, height: PAGE_H, color: rgb(0.027, 0.035, 0.102) });
  p.drawText("InMailly", { x: 16, y: PAGE_H - 36, size: 11, font: bold, color: white });
  const nav = ["Dashboard", "Campaign", "Analytics", "Responses"];
  nav.forEach((item, i) => {
    const ny = PAGE_H - 70 - i * 22;
    if (item === active) {
      p.drawRectangle({ x: 10, y: ny - 5, width: 98, height: 18, color: rgb(0.07, 0.18, 0.22) });
      p.drawText(item, { x: 16, y: ny, size: 8, font: bold, color: cyan });
    } else {
      p.drawText(item, { x: 16, y: ny, size: 8, font, color: luxMuted });
    }
  });

  p.drawRectangle({
    x: 130,
    y: PAGE_H - 52,
    width: PAGE_W - 158,
    height: 28,
    color: rgb(0.04, 0.12, 0.1),
    borderColor: rgb(0.12, 0.4, 0.3),
    borderWidth: 0.6,
  });
  p.drawText(`LIVE CAMPAIGN  ·  ${data.projectName}`.slice(0, 52), {
    x: 138,
    y: PAGE_H - 38,
    size: 7,
    font: bold,
    color: emerald,
  });
  const sentLine = `${data.stats.sends.toLocaleString()} InMails sent  ·  ${data.stats.total.toLocaleString()} responses`;
  p.drawText(sentLine, {
    x: PAGE_W - 28 - font.widthOfTextAtSize(sentLine, 7),
    y: PAGE_H - 38,
    size: 7,
    font,
    color: luxMuted,
  });
}

function metricCard(
  p: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string
) {
  p.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: luxCard,
    borderColor: luxBorder,
    borderWidth: 0.7,
  });
  p.drawText(value, { x: x + 10, y: y + h - 28, size: 16, font: bold, color: white });
  p.drawText(label.toUpperCase(), { x: x + 10, y: y + 10, size: 7, font, color: luxMuted });
}

function addCampaignDashboardPage(
  doc: PDFDocument,
  data: ProjectCaseStudy,
  font: PDFFont,
  bold: PDFFont,
  pageNo: number
) {
  const p = doc.addPage([PAGE_W, PAGE_H]);
  drawAppChrome(p, font, bold, data, "Campaign");
  const left = 140;
  const width = PAGE_W - left - 28;
  let y = PAGE_H - 78;
  p.drawText("YOUR CAMPAIGN", { x: left, y, size: 8, font: bold, color: cyan });
  y -= 22;
  p.drawText(data.projectName.slice(0, 42), { x: left, y, size: 18, font: bold, color: white });
  y -= 16;
  p.drawText(`Status: ${data.status}  ·  ${data.companyName}`, { x: left, y, size: 9, font, color: luxMuted });
  y -= 28;
  const gap = 10;
  const cardW = (width - gap * 2) / 3;
  const cards = [
    { v: data.stats.total.toLocaleString(), l: "Responses" },
    { v: data.stats.interested.toLocaleString(), l: "Interested" },
    { v: data.stats.sends.toLocaleString(), l: "Send proofs" },
  ];
  cards.forEach((c, i) => metricCard(p, font, bold, left + i * (cardW + gap), y - 56, cardW, 56, c.v, c.l));
  y -= 80;

  p.drawRectangle({
    x: left,
    y: y - 118,
    width,
    height: 118,
    color: luxCard,
    borderColor: luxBorder,
    borderWidth: 0.7,
  });
  p.drawText("CAMPAIGN PACKAGE", { x: left + 14, y: y - 18, size: 7, font: bold, color: cyan });
  p.drawText("InMail delivery progress", { x: left + 14, y: y - 36, size: 12, font: bold, color: white });
  const pct = Math.round(data.packagePercent);
  const pctLabel = data.packageSize ? `${pct}%` : "—";
  p.drawText(pctLabel, {
    x: left + width - 14 - bold.widthOfTextAtSize(pctLabel, 18),
    y: y - 36,
    size: 18,
    font: bold,
    color: white,
  });
  p.drawRectangle({
    x: left + 14,
    y: y - 58,
    width: width - 28,
    height: 10,
    color: rgb(0.05, 0.06, 0.08),
  });
  const fill = Math.max(2, ((width - 28) * Math.min(100, data.packagePercent)) / 100);
  p.drawRectangle({
    x: left + 14,
    y: y - 58,
    width: fill,
    height: 10,
    color: cyan,
  });
  const delivered = data.packageSize
    ? `${data.stats.sends.toLocaleString()} / ${data.packageSize.toLocaleString()} InMails delivered`
    : `${data.stats.sends.toLocaleString()} InMails delivered`;
  p.drawText(delivered, { x: left + 14, y: y - 80, size: 10, font, color: white });
  if (data.packageSize) {
    const leftCount = Math.max(0, data.packageSize - data.stats.sends);
    p.drawText(`${leftCount.toLocaleString()} left until package complete`, {
      x: left + 14,
      y: y - 96,
      size: 8,
      font,
      color: cyan,
    });
  }
  y -= 140;

  p.drawRectangle({
    x: left,
    y: y - 100,
    width,
    height: 100,
    color: luxCard,
    borderColor: luxBorder,
    borderWidth: 0.7,
  });
  p.drawText(data.projectName.slice(0, 40), { x: left + 14, y: y - 22, size: 11, font: bold, color: white });
  p.drawText("Verified Sales Nav  ·  Human-operated", {
    x: left + 14,
    y: y - 36,
    size: 8,
    font,
    color: luxMuted,
  });
  const mini = [
    { v: data.stats.sends.toLocaleString(), l: "InMails" },
    { v: data.stats.total.toLocaleString(), l: "Responses" },
    { v: data.stats.interested.toLocaleString(), l: "Hot" },
    { v: `${data.replyRate}%`, l: "Reply rate" },
  ];
  const mw = (width - 28 - 18) / 4;
  mini.forEach((m, i) => {
    const mx = left + 14 + i * (mw + 6);
    p.drawText(m.v, { x: mx, y: y - 64, size: 14, font: bold, color: white });
    p.drawText(m.l.toUpperCase(), { x: mx, y: y - 80, size: 6, font, color: luxMuted });
  });

  drawDashFooter(p, font, pageNo);
  return p;
}

function addAnalyticsDashboardPage(
  doc: PDFDocument,
  data: ProjectCaseStudy,
  font: PDFFont,
  bold: PDFFont,
  pageNo: number
) {
  const p = doc.addPage([PAGE_W, PAGE_H]);
  drawAppChrome(p, font, bold, data, "Analytics");
  const left = 140;
  const width = PAGE_W - left - 28;
  let y = PAGE_H - 78;
  p.drawText("ANALYTICS", { x: left, y, size: 8, font: bold, color: cyan });
  y -= 22;
  p.drawText("Campaign performance", { x: left, y, size: 18, font: bold, color: white });
  y -= 16;
  p.drawText(`${data.companyName}  ·  live dashboard metrics`, { x: left, y, size: 9, font, color: luxMuted });
  y -= 28;

  const target = data.targetTitles?.split(",")[0]?.trim() || "—";
  const items = [
    {
      l: "InMails sent",
      v: data.stats.sends.toLocaleString(),
      s: data.stats.teamSends > data.stats.sends ? `${data.stats.teamSends.toLocaleString()} logged by team` : "1 screenshot = 1 InMail",
    },
    { l: "Total responses", v: data.stats.total.toLocaleString(), s: "Logged by your team" },
    { l: "Hot leads", v: data.stats.interested.toLocaleString(), s: "Interested or replied" },
    { l: "Reply rate", v: `${data.replyRate}%`, s: "Responses ÷ InMails sent" },
    { l: "Target", v: target.slice(0, 28), s: (data.targetTitles || "Audience from brief").slice(0, 42) },
    {
      l: "Package complete",
      v: data.packageSize ? `${Math.round(data.packagePercent)}%` : "—",
      s: data.packageSize ? `${data.stats.sends.toLocaleString()} of ${data.packageSize.toLocaleString()}` : "No package size set",
    },
  ];
  const cw = (width - 12) / 2;
  const ch = 78;
  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = left + col * (cw + 12);
    const cy = y - row * (ch + 12) - ch;
    p.drawRectangle({
      x,
      y: cy,
      width: cw,
      height: ch,
      color: luxCard,
      borderColor: luxBorder,
      borderWidth: 0.7,
    });
    p.drawText(item.l.toUpperCase(), { x: x + 12, y: cy + ch - 18, size: 7, font, color: luxMuted });
    p.drawText(item.v, { x: x + 12, y: cy + 32, size: 18, font: bold, color: white });
    p.drawText(item.s.slice(0, 40), { x: x + 12, y: cy + 14, size: 8, font, color: cyan });
  });

  drawDashFooter(p, font, pageNo);
  return p;
}

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
  const pageShotImages: { label: string; caption: string; img: PDFImage }[] = [];
  for (const shot of data.pageShots || []) {
    const embedded = await embedImage(doc, shot.image);
    if (embedded) pageShotImages.push({ label: shot.label, caption: shot.caption, img: embedded });
  }
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

  drawFooter(page, pageIndex);
  pageIndex += 1;
  addCampaignDashboardPage(doc, data, font, bold, pageIndex);
  pageIndex += 1;
  addAnalyticsDashboardPage(doc, data, font, bold, pageIndex);
  pageIndex += 1;
  page = doc.addPage([PAGE_W, PAGE_H]);
  drawHeader(page, data.companyName);
  drawFooter(page, pageIndex);
  y = PAGE_H - 100;

  const section = (title: string) => {
    const next = ensureSpace(40, y, data.companyName);
    page = next.page;
    y = next.y;
    page.drawText(title, { x: MARGIN, y, size: 11, font: bold, color: ink });
    y -= 6;
    page.drawRectangle({ x: MARGIN, y, width: 36, height: 2, color: cyan });
    y -= 16;
  };

  if (pageShotImages.length) {
    section("Live dashboard screenshots");
    page.drawText("Captured from the campaign page (totals sent) and analytics page.", {
      x: MARGIN,
      y,
      size: 8,
      font,
      color: muted,
    });
    y -= 16;
    for (const shot of pageShotImages) {
      const maxW = CONTENT_W;
      const maxH = 310;
      const scale = Math.min(maxW / shot.img.width, maxH / shot.img.height);
      const w = shot.img.width * scale;
      const h = shot.img.height * scale;
      const needed = 28 + h;
      const next = ensureSpace(needed, y, data.companyName);
      page = next.page;
      y = next.y;
      page.drawText(shot.label, { x: MARGIN, y, size: 10, font: bold, color: ink });
      y -= 12;
      page.drawText(shot.caption, { x: MARGIN, y, size: 8, font, color: muted });
      y -= 10;
      page.drawImage(shot.img, { x: MARGIN, y: y - h, width: w, height: h });
      y -= h + 16;
    }
  }

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
