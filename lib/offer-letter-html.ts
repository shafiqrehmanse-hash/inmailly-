import {
  buildOfferBodyParagraphs,
  formatLetterDate,
  formatPkr,
  type OfferLetterForm,
} from "@/lib/offer-letter";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Print-friendly HTML preview matching PDF layout. */
export function offerLetterPreviewHtml(form: OfferLetterForm) {
  const paragraphs = buildOfferBodyParagraphs(form);
  const body = paragraphs
    .map((p) => {
      if (!p) return `<div style="height:8px"></div>`;
      if (p === "Position details" || p === "Compensation" || p === "Additional terms" || p === "Nature of engagement — important" || p === "Electronic acceptance") {
        const warn = p.includes("Nature");
        return `<p style="margin:18px 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${warn ? "#f59e0b" : "#7c3aed"};">${esc(p)}</p>`;
      }
      if (p.startsWith("Dear ")) {
        return `<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#18181b;">${esc(p)}</p>`;
      }
      if (p.startsWith("•")) {
        return `<p style="margin:0 0 6px 12px;font-size:13px;line-height:1.55;color:#3f3f46;">${esc(p)}</p>`;
      }
      if (p === "Warm regards,") {
        return `<p style="margin:20px 0 8px;font-size:13px;color:#3f3f46;">${esc(p)}</p>`;
      }
      if ([form.signerName, form.signerTitle, form.companyName].includes(p)) {
        return `<p style="margin:0 0 4px;font-size:13px;color:#71717a;">${esc(p)}</p>`;
      }
      return `<p style="margin:0 0 10px;font-size:13px;line-height:1.65;color:#3f3f46;">${esc(p)}</p>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Offer Letter — ${esc(form.candidateName || "Preview")}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:24px;background:#e4e4e7;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:720px;margin:0 auto;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.12);">
    <div style="background:#0c0f24;padding:28px 36px 24px;border-bottom:3px solid #22d3ee;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border:1px solid rgba(34,211,238,0.5);display:flex;align-items:center;justify-content:center;font-weight:800;color:#22d3ee;font-size:14px;">I</div>
            <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.02em;">InMailly</span>
          </div>
          <p style="margin:8px 0 0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#a78bfa;">Offer of employment</p>
        </div>
        <div style="text-align:right;font-size:11px;color:#a1a1aa;line-height:1.6;">
          <div>Ref: ${esc(form.referenceNo)}</div>
          <div>${esc(formatLetterDate(form.letterDate))}</div>
        </div>
      </div>
    </div>
    <div style="padding:32px 36px 40px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;">To</p>
      <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:#18181b;">${esc(form.candidateName || "—")}</p>
      ${form.candidateEmail ? `<p style="margin:0 0 2px;font-size:12px;color:#71717a;">${esc(form.candidateEmail)}</p>` : ""}
      ${form.candidateCity ? `<p style="margin:0 0 16px;font-size:12px;color:#71717a;">${esc(form.candidateCity)}</p>` : ""}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0 24px;padding:16px 18px;background:linear-gradient(135deg,rgba(34,211,238,0.06),rgba(124,58,237,0.04));border:1px solid rgba(34,211,238,0.25);border-radius:8px;">
        <div>
          <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;color:#71717a;">Monthly salary</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#18181b;">${esc(formatPkr(form.monthlySalaryPkr))}</p>
        </div>
        <div>
          <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;color:#71717a;">Commission</p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#3f3f46;">${esc(form.commissionText)}</p>
        </div>
      </div>

      ${body}
    </div>
    <div style="padding:14px 36px;border-top:1px solid #e4e4e7;font-size:10px;color:#a1a1aa;display:flex;justify-content:space-between;">
      <span>InMailly · inmailly.com</span>
      <span>Confidential</span>
    </div>
  </div>
</body>
</html>`;
}

export function offerLetterEmailHtml(form: OfferLetterForm) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#07070b;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0f0f14;border:1px solid rgba(255,255,255,0.08);">
        <tr><td style="height:3px;background:linear-gradient(90deg,#2563eb,#22d3ee,#7c3aed);"></td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#22d3ee;">Offer letter</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#fafafa;">Congratulations, ${esc(form.candidateName.split(" ")[0] || "there")}!</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#a1a1aa;">
            Please find your official offer letter attached as a PDF for the role of <strong style="color:#fafafa;">${esc(form.roleTitle)}</strong>
            at InMailly.
          </p>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#a1a1aa;">
            Monthly salary: <strong style="color:#22d3ee;">${esc(formatPkr(form.monthlySalaryPkr))}</strong><br/>
            Start date: <strong style="color:#fafafa;">${esc(formatLetterDate(form.startDate))}</strong>
          </p>
          <p style="margin:0;font-size:13px;color:#71717a;">Reply to this email to accept or ask any questions.</p>
          <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#71717a;">
            ${esc(form.signerName)}<br/>${esc(form.signerTitle)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
