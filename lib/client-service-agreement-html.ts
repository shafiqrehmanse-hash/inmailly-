import {
  buildClientServiceBodyParagraphs,
  formatLetterDate,
  formatUsd,
  formatInmailCount,
  type ClientServiceAgreementForm,
} from "@/lib/client-service-agreement";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

export function clientServiceAgreementPreviewHtml(form: ClientServiceAgreementForm) {
  const paragraphs = buildClientServiceBodyParagraphs(form);
  const body = paragraphs
    .map((p) => {
      if (!p) return `<div style="height:8px"></div>`;
      if (SECTION_HEADERS.has(p)) {
        const warn = p.includes("important") || p === "Electronic acceptance";
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
      if ([form.signerName, form.signerTitle, form.providerName].includes(p)) {
        return `<p style="margin:0 0 4px;font-size:13px;color:#71717a;">${esc(p)}</p>`;
      }
      return `<p style="margin:0 0 10px;font-size:13px;line-height:1.65;color:#3f3f46;">${esc(p)}</p>`;
    })
    .join("");

  const priceDisplay =
    parseFloat(form.packagePriceUsd) === 0
      ? "Complimentary trial"
      : `${formatUsd(form.packagePriceUsd)} USD`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Service Agreement — ${esc(form.clientCompany || form.contactName || "Preview")}</title>
  <style>@media print { body { margin: 0; } .no-print { display: none !important; } }</style>
</head>
<body style="margin:0;padding:24px;background:#e4e4e7;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:720px;margin:0 auto;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.12);">
    <div style="background:#0c0f24;padding:28px 36px 24px;border-bottom:3px solid #22d3ee;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border:1px solid rgba(34,211,238,0.5);display:flex;align-items:center;justify-content:center;font-weight:800;color:#22d3ee;font-size:14px;">I</div>
            <span style="font-size:20px;font-weight:800;color:#fafafa;">InMailly</span>
          </div>
          <p style="margin:10px 0 0;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#a78bfa;">Client service agreement</p>
        </div>
        <div style="text-align:right;font-size:11px;color:#a1a1aa;line-height:1.6;">
          <div>Ref: ${esc(form.referenceNo)}</div>
          <div>${esc(formatLetterDate(form.letterDate))}</div>
        </div>
      </div>
    </div>
    <div style="padding:32px 36px 40px;">
      <div style="background:linear-gradient(135deg,#f0fdfa,#f5f3ff);border:1px solid #22d3ee;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#71717a;margin-bottom:4px;">${esc(form.packageName)} package</div>
        <div style="font-size:22px;font-weight:800;color:#18181b;">${esc(formatInmailCount(form.inmailPackageSize))} InMails</div>
        <div style="font-size:14px;color:#3f3f46;margin-top:4px;">${esc(priceDisplay)} · ${esc(form.projectName || "Campaign")}</div>
      </div>
      ${body}
    </div>
    <div style="border-top:1px solid #e4e4e7;padding:16px 36px;font-size:10px;color:#a1a1aa;display:flex;justify-content:space-between;">
      <span>InMailly · inmailly.com</span>
      <span>Confidential — client service agreement</span>
    </div>
  </div>
</body>
</html>`;
}

export function clientServiceAgreementEmailHtml(_form: ClientServiceAgreementForm, note?: string) {
  const noteBlock = note?.trim()
    ? `<p style="margin:0 0 16px;padding:12px 16px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#3f3f46;">${esc(note)}</p>`
    : "";
  return `${noteBlock}<p style="font-size:14px;color:#3f3f46;margin-bottom:16px;">Your service agreement is attached as PDF. You can also review and sign electronically in your client portal.</p>`;
}
