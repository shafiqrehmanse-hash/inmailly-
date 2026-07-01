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

function heroBanner(emoji: string, headline: string, subline: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr><td align="center" style="padding:28px 20px;background:linear-gradient(145deg,rgba(37,99,235,0.22) 0%,rgba(34,211,238,0.08) 50%,rgba(124,58,237,0.12) 100%);border:1px solid rgba(34,211,238,0.28);">
      <div style="font-size:42px;line-height:1;margin-bottom:12px;">${emoji}</div>
      <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#fafafa;letter-spacing:-0.02em;">${headline}</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#a1a1aa;">${subline}</p>
    </td></tr>
  </table>`;
}

function featureCard(icon: string, title: string, description: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;">
    <tr>
      <td width="44" valign="top" style="padding:14px 0 14px 14px;font-size:22px;line-height:1;">${icon}</td>
      <td valign="top" style="padding:14px 14px 14px 8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#f4f4f5;">${esc(title)}</p>
        <p style="margin:0;font-size:13px;line-height:1.55;color:#71717a;">${esc(description)}</p>
      </td>
    </tr>
  </table>`;
}

function founderWelcomeSignature() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr><td style="padding:20px 18px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #22d3ee;">
      <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#d4d4d8;font-style:italic;">
        &ldquo;We built InMailly for teams who care about quality outreach — not spam. Glad you&rsquo;re here.&rdquo;
      </p>
      <p style="margin:0;font-size:14px;font-weight:700;color:#fafafa;">Shafiq Rehman</p>
      <p style="margin:4px 0 0;font-size:12px;color:#22d3ee;">Founder, InMailly</p>
      <p style="margin:2px 0 0;font-size:11px;color:#71717a;">Shafiq&rsquo;s Marketing Automations Valley</p>
      <p style="margin:14px 0 0;font-size:12px;color:#52525b;">Reply to this email anytime — it comes straight to me.</p>
    </td></tr>
  </table>`;
}

export type BroadcastSignature = {
  name: string;
  title: string;
  tagline?: string;
  replyLine?: string;
};

export function broadcastSignatureBlock(sig: BroadcastSignature) {
  const tagline = sig.tagline
    ? `<p style="margin:2px 0 0;font-size:11px;color:#71717a;">${esc(sig.tagline)}</p>`
    : "";
  const reply = sig.replyLine
    ? `<p style="margin:14px 0 0;font-size:12px;color:#52525b;">${esc(sig.replyLine)}</p>`
    : "";
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr><td style="padding:20px 18px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #22d3ee;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#fafafa;">${esc(sig.name)}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#22d3ee;">${esc(sig.title)}</p>
      ${tagline}
      ${reply}
    </td></tr>
  </table>`;
}

function messageParagraphs(message: string) {
  const blocks = message.trim().split(/\n\n+/).filter(Boolean);
  if (!blocks.length) {
    return p('<span style="color:#71717a;font-style:italic;">Your message will appear here…</span>');
  }
  return blocks
    .map((block) => {
      const html = esc(block).replace(/\n/g, "<br/>");
      return p(html);
    })
    .join("");
}

export const FOUNDER_BROADCAST_SIGNATURE: BroadcastSignature = {
  name: "Shafiq Rehman",
  title: "Founder, InMailly",
  tagline: "Shafiq's Marketing Automations Valley",
  replyLine: "Reply to this email anytime — it comes straight to me.",
};

export function leaderBroadcastSignature(leaderName: string): BroadcastSignature {
  return {
    name: leaderName,
    title: "Team Leader, InMailly",
    replyLine: "Reply to this email anytime — I'm here to help.",
  };
}

/** Dark HTML broadcast — same lux layout as welcome email. Message is sent exactly as written. */
export function teamBroadcastEmail(data: {
  subject: string;
  message: string;
  signature: BroadcastSignature;
}) {
  return emailLayout({
    preheader: data.message.trim().slice(0, 140) || data.subject,
    eyebrow: "Team message",
    title: data.subject.trim() || "Update from your team",
    bodyHtml: [messageParagraphs(data.message), broadcastSignatureBlock(data.signature)].join(""),
    footerNote: "You're on the InMailly outreach team — built for ambitious closers.",
  });
}

export function teamBroadcastPlainText(data: {
  subject: string;
  message: string;
  signature: BroadcastSignature;
}) {
  const sigLines = [
    "",
    "Warm regards,",
    "",
    data.signature.name,
    data.signature.title,
    data.signature.tagline || "",
    data.signature.replyLine || "",
  ]
    .filter(Boolean)
    .join("\n");
  return `${data.message.trim()}${sigLines}`;
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
      p("Someone just created a client account on InMailly. <strong style=\"color:#fafafa;\">Email verification is pending.</strong>"),
      detailRow("Name", data.name),
      detailRow("Email", data.email),
      data.company ? detailRow("Company", data.company) : "",
      detailRow("Source", "Self signup"),
    ].join(""),
    cta: { href: `${site}/admin/clients`, label: "Open clients panel →" },
    footerNote: `You'll get another email when they verify. Reply directly to reach ${data.email}.`,
  });
}

export function adminClientVerifiedEmail(data: { name: string; email: string; company?: string | null }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: `Client verified: ${data.name}`,
    eyebrow: "Admin alert",
    title: "Client email verified",
    bodyHtml: [
      p("<strong style=\"color:#22d3ee;\">A client just verified their email</strong> and can access their dashboard."),
      detailRow("Name", data.name),
      detailRow("Email", data.email),
      data.company ? detailRow("Company", data.company) : "",
    ].join(""),
    cta: { href: `${site}/admin/clients`, label: "View in admin →" },
    footerNote: `They are live in the system. Reach them at ${data.email}.`,
  });
}

export function adminTeamSignupPendingEmail(data: { name: string; email: string; inviteCode?: string | null }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: `New team signup: ${data.name}`,
    eyebrow: "Admin alert",
    title: "New team member signed up",
    bodyHtml: [
      p("Someone registered for the outreach team. <strong style=\"color:#fafafa;\">They must verify email before accessing the workspace.</strong>"),
      detailRow("Name", data.name),
      detailRow("Email", data.email),
      data.inviteCode ? detailRow("Invite code", data.inviteCode) : "",
    ].join(""),
    cta: { href: `${site}/admin/team/members`, label: "Open team panel →" },
    footerNote: "You'll get another email when they verify their address.",
  });
}

export function adminTeamVerifiedEmail(data: { name: string; email: string; inviteCode?: string | null }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: `Team member verified: ${data.name}`,
    eyebrow: "Admin alert",
    title: "Team member email verified",
    bodyHtml: [
      p("<strong style=\"color:#22d3ee;\">A team member just verified their email</strong> and can now access the outreach workspace."),
      detailRow("Name", data.name),
      detailRow("Email", data.email),
      data.inviteCode ? detailRow("Invite code", data.inviteCode) : "",
    ].join(""),
    cta: { href: `${site}/admin/team/members`, label: "View team members →" },
    footerNote: `${data.name} can now log in at ${site}/team/login`,
  });
}

export function teamVerifyEmail(data: { firstName: string; verifyUrl: string }) {
  const site = getSiteUrl();
  return emailLayout({
    preheader: "Verify your email to access the InMailly team workspace",
    eyebrow: "Team account",
    title: `Welcome, ${data.firstName}`,
    bodyHtml: [
      p("Thanks for joining the InMailly outreach team. Verify your email to unlock your workspace — links, leads, scripts, and responses."),
      p("You won't be able to log in until this step is complete."),
    ].join(""),
    cta: { href: data.verifyUrl, label: "Verify email & join team →" },
    secondaryCta: { href: `${site}/team/login`, label: "Already verified? Log in →" },
    footerNote: "This link expires in 24 hours. If you didn't sign up, ignore this email.",
  });
}

export function teamWelcomeVerifiedEmail(data: { firstName: string }) {
  const site = getSiteUrl();
  const name = esc(data.firstName);
  return emailLayout({
    preheader: `${data.firstName}, your InMailly team workspace is live — let's go`,
    eyebrow: "Welcome to the team",
    title: `You're in, ${name} ✦`,
    bodyHtml: [
      heroBanner("✓", "Email verified — workspace unlocked", "Your outreach command center is ready. Time to claim links and close deals."),
      p(`Hey <strong style="color:#fafafa;">${name}</strong>, welcome to the InMailly outreach team. You just joined a system built for serious LinkedIn prospecting — not random DMs.`),
      `<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">Your toolkit</p>`,
      featureCard("⛓", "Work links", "Claim LinkedIn profiles from the pool and mark them used as you outreach."),
      featureCard("📋", "Marketing leads", "Log every reply, track status, and build your personal pipeline."),
      featureCard("💬", "Responses", "See hot leads who replied and keep the conversation going."),
      founderWelcomeSignature(),
    ].join(""),
    cta: { href: `${site}/team/hub`, label: "Open my workspace →" },
    secondaryCta: { href: `${site}/team/links`, label: "Claim my first links →" },
    footerNote: "Pro tip: check Daily Scripts on your hub before you start today's outreach session.",
  });
}

export function teamInviteProspectEmail(data: {
  inviteCode: string;
  leaderName: string;
  registerUrl: string;
  personalNote?: string | null;
}) {
  const site = getSiteUrl();
  const leader = esc(data.leaderName);
  const noteBlock = data.personalNote?.trim()
    ? p(`<em style="color:#d4d4d8;">&ldquo;${esc(data.personalNote.trim())}&rdquo;</em> — <strong style="color:#fafafa;">${leader}</strong>`)
    : p(`You've been invited to join the InMailly outreach team by <strong style="color:#fafafa;">${leader}</strong>.`);
  return emailLayout({
    preheader: `Join the InMailly team — your invite code is ${data.inviteCode}`,
    eyebrow: "Team invitation",
    title: "You're invited to join InMailly",
    bodyHtml: [
      heroBanner("✦", "Outreach team invite", "Use your personal code below to create your account."),
      noteBlock,
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
        <tr><td align="center" style="padding:20px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.25);">
          <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#71717a;">Your invite code</p>
          <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;color:#22d3ee;font-family:ui-monospace,monospace;">${esc(data.inviteCode)}</p>
        </td></tr>
      </table>`,
      p("Create your account, verify your email, then open <strong style=\"color:#fafafa;\">Work Links</strong> to start claiming profiles."),
      founderWelcomeSignature(),
    ].join(""),
    cta: { href: data.registerUrl, label: "Join the team →" },
    secondaryCta: { href: `${site}/team/login`, label: "Already have an account? Log in →" },
    footerNote: "This code is single-use per signup batch. If you didn't expect this invite, you can ignore this email.",
  });
}

export function clientWelcomeVerifiedEmail(data: { firstName: string; company?: string | null }) {
  const site = getSiteUrl();
  const name = esc(data.firstName);
  const companyLine = data.company
    ? p(`Your <strong style="color:#fafafa;">${esc(data.company)}</strong> preview project is set up and waiting.`)
    : p("Your preview project is set up and waiting in the dashboard.");
  return emailLayout({
    preheader: `${data.firstName}, your InMailly client dashboard is ready`,
    eyebrow: "Welcome to InMailly",
    title: `Welcome aboard, ${name}`,
    bodyHtml: [
      heroBanner("◆", "You're officially verified", "Your live campaign command center is unlocked — the same view you'll use when outreach goes live."),
      p(`Hi <strong style="color:#fafafa;">${name}</strong>, thank you for trusting InMailly with your outreach. We run managed LinkedIn campaigns with real humans, real proof, and a dashboard you can actually use.`),
      companyLine,
      `<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">Inside your dashboard</p>`,
      featureCard("📊", "Campaign overview", "Track InMails sent, responses, and hot leads in one clean view."),
      featureCard("💬", "Responses inbox", "Every reply from your campaign lands here — with full thread history."),
      featureCard("📸", "Send proofs", "See screenshot proof of every InMail your team sends on your behalf."),
      founderWelcomeSignature(),
    ].join(""),
    cta: { href: `${site}/client/dashboard`, label: "Open my dashboard →" },
    secondaryCta: { href: `${site}/contact`, label: "Book a launch call with Shafiq →" },
    footerNote: "When you're ready to go live, book a call and send us your target audience + InMail script. We'll handle the rest.",
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
