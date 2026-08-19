/**
 * Builds InMailly Team Operating Guide PDF from public HTML.
 * Usage: node scripts/generate-team-guide-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "public/guides/team-operating-guide/index.html");
const pdfPath = path.join(root, "public/guides/InMailly-Team-Operating-Guide.pdf");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing:", htmlPath);
  process.exit(1);
}

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "14mm", right: "12mm", bottom: "16mm", left: "12mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#888;padding-top:4mm;">InMailly Team Guide</div>`,
  footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#888;padding-bottom:4mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
});
await browser.close();
console.log("Wrote", pdfPath);
