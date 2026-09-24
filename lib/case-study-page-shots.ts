import type { CaseStudyImage, ProjectCaseStudy } from "@/lib/case-study";

export type CaseStudyPageShot = {
  label: string;
  caption: string;
  image: CaseStudyImage;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(active: "overview" | "campaign" | "analytics", body: string, d: ProjectCaseStudy) {
  const tab = (id: string, label: string) =>
    `<span class="tab ${active === id ? "on" : ""}">${esc(label)}</span>`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #05070B; color: #fff; font-family: "DM Sans", sans-serif; }
  .app { display: flex; min-height: 100vh; }
  .side { width: 220px; background: #07091a; border-right: 1px solid rgba(255,255,255,.06); padding: 22px 16px; }
  .brand { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 18px; }
  .brand span { color: #22D3EE; }
  .nav { margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }
  .nav i { display: block; color: #9DA8B8; font-size: 12px; padding: 8px 10px; border-radius: 8px; font-style: normal; }
  .nav i.on { background: rgba(34,211,238,.12); color: #22D3EE; }
  .main { flex: 1; padding: 22px 28px 36px; }
  .banner { display: flex; justify-content: space-between; align-items: center; gap: 12px; border: 1px solid rgba(16,185,129,.28); background: rgba(16,185,129,.08); padding: 10px 14px; margin-bottom: 16px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #34d399; font-weight: 600; }
  .muted { color: #9DA8B8; }
  .tabs { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
  .tab { font-size: 12px; color: #9DA8B8; border: 1px solid rgba(255,255,255,.08); padding: 7px 12px; border-radius: 999px; }
  .tab.on { color: #fff; border-color: rgba(34,211,238,.4); background: rgba(34,211,238,.1); }
  h1 { font-family: "Bricolage Grotesque", sans-serif; font-size: 28px; font-weight: 800; }
  .kicker { font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #22D3EE; font-weight: 600; margin-bottom: 6px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .card { background: #131A24; border: 1px solid rgba(255,255,255,.06); padding: 16px; }
  .elite { background: linear-gradient(180deg, #131A24, #0C1018); border: 1px solid rgba(124,106,239,.22); padding: 16px; text-align: center; }
  .num { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 26px; font-variant-numeric: tabular-nums; }
  .lbl { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #9DA8B8; margin-top: 6px; }
  .sub { font-size: 11px; color: #22D3EE; margin-top: 6px; }
  .bar-wrap { height: 12px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); border-radius: 999px; overflow: hidden; margin: 10px 0 8px; }
  .bar { height: 100%; background: linear-gradient(90deg, #2563EB, #7C6AEF, #22D3EE); }
  .row { display: flex; justify-content: space-between; align-items: flex-end; }
  .pipe { margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .pipe div { border: 1px solid rgba(255,255,255,.06); padding: 10px; }
  .pipe b { display: block; font-size: 16px; }
  .status { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #34d399; border: 1px solid rgba(52,211,153,.3); padding: 4px 8px; }
</style>
</head>
<body>
<div class="app">
  <aside class="side">
    <div class="brand">In<span>Mailly</span></div>
    <div class="nav">
      <i class="on">Dashboard</i>
      <i>Campaign</i>
      <i>Responses</i>
      <i>Send proofs</i>
    </div>
  </aside>
  <main class="main">
    <div class="banner">
      <span>Live campaign · ${esc(d.projectName)}</span>
      <span class="muted" style="letter-spacing:0; text-transform:none; color:#9DA8B8">${d.stats.sends.toLocaleString()} InMails sent · ${d.stats.total.toLocaleString()} responses</span>
    </div>
    <div class="tabs">
      ${tab("overview", "Overview")}
      ${tab("campaign", "Campaign")}
      ${tab("analytics", "Analytics")}
    </div>
    ${body}
  </main>
</div>
</body>
</html>`;
}

function campaignHtml(d: ProjectCaseStudy) {
  const remaining = d.packageSize ? Math.max(0, d.packageSize - d.stats.sends) : 0;
  const pct = Math.round(d.packagePercent);
  const body = `
    <div class="kicker">Your campaign</div>
    <h1>${esc(d.projectName)}</h1>
    <p class="muted" style="margin-top:8px;font-size:13px">Status: ${esc(d.status)} · ${esc(d.companyName)}</p>
    <div class="grid3">
      <div class="elite"><div class="num">${d.stats.total.toLocaleString()}</div><div class="lbl">Responses</div></div>
      <div class="elite"><div class="num">${d.stats.interested.toLocaleString()}</div><div class="lbl">Interested</div></div>
      <div class="elite"><div class="num">${d.stats.sends.toLocaleString()}</div><div class="lbl">Send proofs</div></div>
    </div>
    ${
      d.packageSize
        ? `<div class="card">
      <div class="kicker">Campaign package</div>
      <div class="row">
        <div>
          <div style="font-family:Bricolage Grotesque,sans-serif;font-weight:800;font-size:20px">InMail delivery progress</div>
          <p class="muted" style="font-size:12px;margin-top:6px">Each verified send proof counts as one InMail toward your package.</p>
        </div>
        <div style="text-align:right"><div class="num">${pct}%</div><div class="lbl">Complete</div></div>
      </div>
      <div class="bar-wrap"><div class="bar" style="width:${Math.min(100, d.packagePercent)}%"></div></div>
      <div class="row">
        <div><div class="num" style="font-size:22px">${d.stats.sends.toLocaleString()} <span class="muted" style="font-size:16px">/ ${d.packageSize.toLocaleString()}</span></div><div class="lbl">InMails delivered</div></div>
        <div style="text-align:right;color:#22D3EE;font-weight:600;font-size:14px">${remaining.toLocaleString()} left</div>
      </div>
    </div>`
        : ""
    }
    <div class="card" style="margin-top:14px">
      <div class="row">
        <div>
          <div style="font-family:Bricolage Grotesque,sans-serif;font-weight:800">${esc(d.projectName)}</div>
          <p class="muted" style="font-size:11px;margin-top:4px">Verified Sales Nav · Human-operated</p>
        </div>
        <span class="status">${esc(d.status)}</span>
      </div>
      <div class="grid4">
        <div class="card" style="text-align:center;padding:12px"><div class="num" style="font-size:20px">${d.stats.sends.toLocaleString()}</div><div class="lbl">InMails</div></div>
        <div class="card" style="text-align:center;padding:12px"><div class="num" style="font-size:20px">${d.stats.total.toLocaleString()}</div><div class="lbl">Responses</div></div>
        <div class="card" style="text-align:center;padding:12px"><div class="num" style="font-size:20px">${d.stats.interested.toLocaleString()}</div><div class="lbl">Hot</div></div>
        <div class="card" style="text-align:center;padding:12px"><div class="num" style="font-size:20px">${d.replyRate}%</div><div class="lbl">Reply rate</div></div>
      </div>
    </div>`;
  return shell("campaign", body, d);
}

function analyticsHtml(d: ProjectCaseStudy) {
  const target = d.targetTitles?.split(",")[0]?.trim() || "—";
  const cards = [
    {
      label: "InMails sent",
      value: d.stats.sends.toLocaleString(),
      sub: d.stats.teamSends > d.stats.sends ? `${d.stats.teamSends.toLocaleString()} logged by team` : "1 screenshot = 1 InMail",
    },
    { label: "Total responses", value: d.stats.total.toLocaleString(), sub: "Logged by your team" },
    { label: "Hot leads", value: d.stats.interested.toLocaleString(), sub: "Interested or replied" },
    { label: "Reply rate", value: `${d.replyRate}%`, sub: "Responses ÷ InMails sent" },
    { label: "Target", value: target, sub: d.targetTitles || "Audience from brief" },
    {
      label: "Package complete",
      value: d.packageSize ? `${Math.round(d.packagePercent)}%` : "—",
      sub: d.packageSize ? `${d.stats.sends.toLocaleString()} of ${d.packageSize.toLocaleString()}` : "No package size set",
    },
  ];
  const body = `
    <div class="kicker">Analytics</div>
    <h1>Campaign performance</h1>
    <p class="muted" style="margin:8px 0 16px;font-size:13px">${esc(d.companyName)} · live dashboard metrics</p>
    <div class="grid2">
      ${cards
        .map(
          (c) => `<div class="card">
        <div class="lbl">${esc(c.label)}</div>
        <div class="num" style="margin-top:6px;font-size:28px">${esc(c.value)}</div>
        <div class="sub">${esc(c.sub)}</div>
      </div>`
        )
        .join("")}
    </div>`;
  return shell("analytics", body, d);
}

function overviewHtml(d: ProjectCaseStudy) {
  const body = `
    <div class="grid3">
      <div class="card"><div class="num">${d.stats.sends.toLocaleString()}</div><div class="lbl">InMails sent</div></div>
      <div class="card"><div class="num">${d.replyRate}%</div><div class="lbl">Reply rate</div><div class="sub">${d.stats.total.toLocaleString()} responses</div></div>
      <div class="card"><div class="num">${d.stats.total.toLocaleString()}</div><div class="lbl">Responses</div></div>
    </div>
    <div class="pipe">
      <div><b>${d.stats.sends.toLocaleString()}</b><div class="lbl">InMails</div></div>
      <div><b>${d.stats.replied.toLocaleString()}</b><div class="lbl">Replied</div></div>
      <div><b>${d.stats.interested.toLocaleString()}</b><div class="lbl">Hot</div></div>
      <div><b>${d.stats.total.toLocaleString()}</b><div class="lbl">Responses</div></div>
    </div>`;
  return shell("overview", body, d);
}

export async function captureCaseStudyPageShots(data: ProjectCaseStudy): Promise<CaseStudyPageShot[]> {
  try {
    const puppeteerMod = await import("puppeteer");
    const puppeteer = puppeteerMod.default ?? puppeteerMod;
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
    });
    try {
      const run = async (html: string, width: number, height: number): Promise<CaseStudyImage | null> => {
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 1.25 });
        await page.setContent(html, { waitUntil: "load", timeout: 15000 });
        await new Promise((r) => setTimeout(r, 350));
        const buf = await page.screenshot({ type: "jpeg", quality: 84, fullPage: true });
        await page.close();
        const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        return { bytes, kind: "jpg" };
      };

      const shots: CaseStudyPageShot[] = [];
      const campaign = await run(campaignHtml(data), 1280, 900);
      if (campaign) {
        shots.push({
          label: "Campaign page",
          caption: "Live campaign workspace — totals sent, responses, and package progress.",
          image: campaign,
        });
      }
      const analytics = await run(analyticsHtml(data), 1280, 860);
      if (analytics) {
        shots.push({
          label: "Analytics page",
          caption: "Analytics view — InMails sent, responses, hot leads, and reply rate.",
          image: analytics,
        });
      }
      const overview = await run(overviewHtml(data), 1280, 720);
      if (overview) {
        shots.push({
          label: "Dashboard overview",
          caption: "Client dashboard overview with sent volume and pipeline.",
          image: overview,
        });
      }
      return shots;
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.error("[case-study] page screenshot failed:", e);
    return [];
  }
}
