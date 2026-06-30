import { getSiteUrl } from "@/lib/site-url";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type LayoutOpts = {
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  footerNote?: string;
};

export function emailLayout(opts: LayoutOpts) {
  const site = getSiteUrl();
  const preheader = opts.preheader || opts.title;
  const ctaBlock = opts.cta
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
        <tr><td align="center" style="border-radius:6px;background:linear-gradient(135deg,#2563eb 0%,#0891b2 100%);">
          <a href="${opts.cta.href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${esc(opts.cta.label)}</a>
        </td></tr>
      </table>`
    : "";

  const secondaryBlock = opts.secondaryCta
    ? `<p style="margin:16px 0 0;font-size:13px;text-align:center;">
        <a href="${opts.secondaryCta.href}" style="color:#22d3ee;text-decoration:none;font-weight:600;">${esc(opts.secondaryCta.label)}</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#07070b;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#07070b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr><td style="padding:0 0 24px;text-align:center;">
          <table cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="width:36px;height:36px;border:1px solid rgba(37,99,235,0.5);background:rgba(37,99,235,0.12);text-align:center;vertical-align:middle;font-size:16px;font-weight:800;color:#60a5fa;font-family:Georgia,serif;">I</td>
              <td style="padding-left:12px;font-size:20px;font-weight:800;color:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.02em;">InMailly</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#0f0f14;border:1px solid rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height:3px;background:linear-gradient(90deg,#2563eb,#22d3ee,#7c3aed);font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:36px 36px 32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${opts.eyebrow ? `<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#22d3ee;">${esc(opts.eyebrow)}</p>` : ""}
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;line-height:1.2;color:#fafafa;letter-spacing:-0.03em;">${esc(opts.title)}</h1>
              ${opts.bodyHtml}
              ${ctaBlock}
              ${secondaryBlock}
              ${opts.footerNote ? `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;line-height:1.6;color:#71717a;">${opts.footerNote}</p>` : ""}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 8px 0;text-align:center;font-family:system-ui,sans-serif;font-size:12px;color:#52525b;line-height:1.6;">
          <a href="${site}" style="color:#71717a;text-decoration:none;">inmailly.com</a>
          &nbsp;·&nbsp; Managed LinkedIn outreach infrastructure
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#a1a1aa;">${text}</p>`;
}

export function detailRow(label: string, value: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
    <tr>
      <td style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);font-size:12px;color:#71717a;width:90px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-left:none;font-size:14px;color:#e4e4e7;">${esc(value)}</td>
    </tr>
  </table>`;
}

export function adminClientSignupEmail(data: { name: string; email: string; company?: string | null }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: `New client signed up: ${data.name}`,
    eyebrow: "Admin alert",
    title: "New client signed up",
    bodyHtml: [
      p("Someone just created a client account on InMailly."),
      detailRow("Name", data.name),
      detailRow("Email", data.email),
      data.company ? detailRow("Company", data.company) : "",
      detailRow("Source", "Self signup"),
    ].join(""),
    cta: { href: `${site}/admin`, label: "Open admin panel →" },
    footerNote: `Reply directly to this email to reach ${data.email}.`,
  });
}

export function clientVerifyEmail(data: { firstName: string; verifyUrl: string }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: "Verify your email to access your InMailly dashboard",
    eyebrow: "Client account",
    title: `Welcome, ${data.firstName}`,
    bodyHtml: [
      p("Thanks for joining InMailly. Verify your email to unlock your <strong style=\"color:#fafafa;\">preview dashboard</strong> — the same live command center you'll use when your campaign launches."),
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr><td style="padding:16px 18px;background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.2);">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a1aa;"><strong style="color:#22d3ee;">What you get:</strong> Overview, responses inbox, send proofs, campaign stats — all in one place.</p>
        </td></tr>
      </table>`,
    ].join(""),
    cta: { href: data.verifyUrl, label: "Verify email & open dashboard" },
    secondaryCta: { href: `${site}/contact`, label: "Book a launch call instead →" },
    footerNote: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
  });
}

export function clientWelcomeVerifiedEmail(data: { firstName: string }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: "Your email is verified — dashboard ready",
    eyebrow: "You're in",
    title: "Dashboard unlocked",
    bodyHtml: [
      p(`Hi ${esc(data.firstName)}, your email is verified and your preview dashboard is ready.`),
      p("Explore the layout now. When you're ready to go live, book a call and send us your target audience + InMail script."),
    ].join(""),
    cta: { href: `${site}/client/dashboard`, label: "Go to my dashboard →" },
  });
}

export function adminContactEmail(data: {
  name: string;
  email: string;
  company?: string | null;
  volume?: string | null;
  message?: string | null;
}) {
  return emailLayout({
    preheader: `New contact from ${data.name}`,
    eyebrow: "Contact form",
    title: "New inquiry",
    bodyHtml: [
      p("Someone submitted the contact form on inmailly.com."),
      detailRow("Name", data.name),
      detailRow("Email", data.email),
      data.company ? detailRow("Company", data.company) : "",
      data.volume ? detailRow("Volume", data.volume) : "",
      data.message ? detailRow("Message", data.message) : "",
    ].join(""),
    footerNote: `Reply to reach them at ${data.email}.`,
  });
}

export function clientCampaignLiveEmail(data: { clientName: string; projectName: string }) {
  return clientCampaignStartedEmail(data);
}

export function clientCampaignStartedEmail(data: { clientName: string; projectName: string }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: `We've started your InMail campaign: ${data.projectName}`,
    eyebrow: "Campaign update",
    title: "We've started your campaign",
    bodyHtml: [
      p(
        `Hi ${esc(data.clientName)}, great news — your InMailly team has kicked off <strong style="color:#fafafa;">${esc(data.projectName)}</strong>.`
      ),
      p(
        "Outreach is now in progress on verified LinkedIn accounts. As your team sends InMails and logs replies, you'll see live send proofs and responses in your dashboard."
      ),
      p("We'll keep you updated as hot leads come in. You can also submit follow-up messages from any response card."),
    ].join(""),
    cta: { href: `${site}/client/dashboard`, label: "Open your dashboard →" },
    footerNote: "Questions? Reply to this email — we're here to help.",
  });
}

export function clientCampaignFinishedEmail(data: { clientName: string; projectName: string }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: `Your campaign ${data.projectName} is complete`,
    eyebrow: "Campaign complete",
    title: "Your campaign has finished",
    bodyHtml: [
      p(
        `Hi ${esc(data.clientName)}, <strong style="color:#fafafa;">${esc(data.projectName)}</strong> has wrapped up.`
      ),
      p(
        "Log in to review your final stats — total InMails sent, responses, hot leads, and send proofs are all saved in your dashboard."
      ),
      p("Want to run another wave or start a new audience? Reply to this email and we'll plan the next phase with you."),
    ].join(""),
    cta: { href: `${site}/client/dashboard`, label: "View final results →" },
    secondaryCta: { href: `${site}/contact`, label: "Book a follow-up call →" },
    footerNote: "Reply directly — we'd love to hear how the campaign performed.",
  });
}

export function clientCustomEmail(data: { clientName: string; subject: string; message: string }) {
  const site = getSiteUrl();
  const body = esc(data.message).replace(/\n/g, "<br/>");
  return emailLayout({
    preheader: data.subject,
    eyebrow: "InMailly",
    title: data.subject,
    bodyHtml: [
      p(`Hi ${esc(data.clientName)},`),
      `<div style="margin:0 0 14px;padding:16px 18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);font-size:15px;line-height:1.65;color:#e4e4e7;">${body}</div>`,
    ].join(""),
    cta: { href: `${site}/client/dashboard`, label: "Open dashboard →" },
    footerNote: "Reply to this email with your answer — it goes straight to your InMailly team.",
  });
}

export function clientNewResponseEmail(data: {
  clientName: string;
  projectName: string;
  leadName: string;
  preview?: string | null;
}) {
  const site = getSiteUrl();
  return emailLayout({
    eyebrow: "New response",
    title: `${data.leadName} replied`,
    bodyHtml: [
      p(`Hi ${esc(data.clientName)}, you have a new response on <strong style="color:#fafafa;">${esc(data.projectName)}</strong>.`),
      detailRow("Contact", data.leadName),
      data.preview ? detailRow("Preview", data.preview) : "",
    ].join(""),
    cta: { href: `${site}/client/dashboard`, label: "View in dashboard →" },
  });
}

export function clientSendProofEmail(data: { clientName: string; projectName: string; count: number }) {
  const site = getSiteUrl();
  const n = data.count;
  return emailLayout({
    eyebrow: "Send proof",
    title: `${n} new send proof${n !== 1 ? "s" : ""}`,
    bodyHtml: p(
      `Hi ${esc(data.clientName)}, your team uploaded ${n} InMail send proof${n !== 1 ? "s" : ""} for <strong style="color:#fafafa;">${esc(data.projectName)}</strong>.`
    ),
    cta: { href: `${site}/client/dashboard`, label: "View send proofs →" },
  });
}

export function teamClientFollowupEmail(data: {
  clientName: string;
  projectName: string;
  leadName: string;
  message: string;
  isUpdate?: boolean;
}) {
  const site = getSiteUrl();
  return emailLayout({
    eyebrow: "Client follow-up",
    title: data.isUpdate ? "Follow-up updated" : "New follow-up to send",
    bodyHtml: [
      p(
        `<strong style="color:#fafafa;">${esc(data.clientName)}</strong> wrote a follow-up for <strong style="color:#fafafa;">${esc(data.leadName)}</strong> on ${esc(data.projectName)}. Send this on LinkedIn:`
      ),
      detailRow("Message", data.message),
    ].join(""),
    cta: { href: `${site}/campaign/hub`, label: "Open campaign hub →" },
  });
}
