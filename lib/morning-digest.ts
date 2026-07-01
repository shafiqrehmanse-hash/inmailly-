import { emailLayout, p } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import type { TeamPerformanceData } from "@/lib/team-performance";

export type DigestGoal = {
  targetLeads: number;
  currentLeads: number;
  weekStart: string;
} | null;

export function morningDigestSubject() {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `InMailly morning brief — ${date}`;
}

export function morningDigestPlain(
  perf: TeamPerformanceData,
  goal: DigestGoal,
  focusMessage: string | null
) {
  const top = perf.members.slice(0, 3);
  const attention = perf.members.filter((m) => m.needsAttention && m.role !== "team_leader");

  const lines = [
    "Good morning — here's your team activity snapshot.",
    "",
    `Pool available: ${perf.totals.poolAvailable}`,
    `Links used today: ${perf.totals.usedToday}`,
    `Leads logged today: ${perf.totals.leadsToday}`,
    `Leads this week: ${perf.totals.leadsWeek}`,
    `Members needing attention: ${perf.totals.needsAttention}`,
    `Inactive 24h+: ${perf.totals.inactive}`,
  ];

  if (goal) {
    const pct = Math.min(100, Math.round((goal.currentLeads / goal.targetLeads) * 100));
    lines.push("", `Weekly goal: ${goal.currentLeads} / ${goal.targetLeads} leads (${pct}%)`);
  }

  if (focusMessage) {
    lines.push("", `Team focus: ${focusMessage}`);
  }

  if (top.length) {
    lines.push("", "Top performers this week:");
    for (const m of top) {
      lines.push(`  #${m.rank} ${m.name} — ${m.usedWeek} used, ${m.leadsWeek} leads`);
    }
  }

  if (attention.length) {
    lines.push("", "Needs attention:");
    for (const m of attention.slice(0, 8)) {
      const flags = [
        m.inactive24h ? "inactive 24h+" : null,
        m.staleClaimed > 0 ? `${m.staleClaimed} stale links` : null,
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(`  • ${m.name} — ${flags || "low activity"}`);
    }
  }

  lines.push("", "— InMailly Team Ops");
  return lines.join("\n");
}

export function morningDigestHtml(
  perf: TeamPerformanceData,
  goal: DigestGoal,
  focusMessage: string | null
) {
  const top = perf.members.slice(0, 3);
  const attention = perf.members.filter((m) => m.needsAttention && m.role !== "team_leader");

  const stats = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      ${[
        ["Links in pool", String(perf.totals.poolAvailable)],
        ["Used today", String(perf.totals.usedToday)],
        ["Leads today", String(perf.totals.leadsToday)],
        ["Leads this week", String(perf.totals.leadsWeek)],
        ["Need attention", String(perf.totals.needsAttention)],
        ["Inactive 24h+", String(perf.totals.inactive)],
      ]
        .map(
          ([label, val]) => `<tr>
            <td style="padding:8px 0;font-size:14px;color:#a1a1aa;border-bottom:1px solid rgba(255,255,255,0.06);">${label}</td>
            <td align="right" style="padding:8px 0;font-size:15px;font-weight:700;color:#22d3ee;border-bottom:1px solid rgba(255,255,255,0.06);">${val}</td>
          </tr>`
        )
        .join("")}
    </table>`;

  let goalBlock = "";
  if (goal) {
    const pct = Math.min(100, Math.round((goal.currentLeads / goal.targetLeads) * 100));
    goalBlock = `<div style="margin:0 0 20px;padding:16px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:4px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#fbbf24;">Weekly team goal</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:#fafafa;">${goal.currentLeads} / ${goal.targetLeads} leads <span style="color:#fbbf24;">(${pct}%)</span></p>
    </div>`;
  }

  const focusBlock = focusMessage
    ? `<div style="margin:0 0 20px;padding:16px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.28);border-radius:4px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#a78bfa;">Team focus</p>
        <p style="margin:0;font-size:15px;line-height:1.55;color:#e4e4e7;">${focusMessage.replace(/</g, "&lt;")}</p>
      </div>`
    : "";

  const topBlock =
    top.length > 0
      ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#22d3ee;">Top performers</p>
        <ul style="margin:0 0 20px;padding:0 0 0 18px;color:#a1a1aa;font-size:14px;line-height:1.7;">
          ${top.map((m) => `<li><strong style="color:#fafafa;">#${m.rank} ${m.name}</strong> — ${m.usedWeek} used, ${m.leadsWeek} leads</li>`).join("")}
        </ul>`
      : "";

  const attentionBlock =
    attention.length > 0
      ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fbbf24;">Needs attention</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#a1a1aa;font-size:14px;line-height:1.7;">
          ${attention
            .slice(0, 8)
            .map((m) => {
              const flags = [
                m.inactive24h ? "inactive 24h+" : null,
                m.staleClaimed > 0 ? `${m.staleClaimed} stale` : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return `<li><strong style="color:#fafafa;">${m.name}</strong>${flags ? ` — ${flags}` : ""}</li>`;
            })
            .join("")}
        </ul>`
      : p("Everyone looks on track — no urgent flags right now.");

  return emailLayout({
    eyebrow: "Morning brief",
    title: "Team activity snapshot",
    preheader: `${perf.totals.usedToday} links used today · ${perf.totals.leadsToday} leads today`,
    bodyHtml: `${p("Good morning — here's what your outreach team did recently.")}${stats}${goalBlock}${focusBlock}${topBlock}${attentionBlock}`,
    cta: { href: `${getSiteUrl()}/team/hub`, label: "Open team workspace" },
    footerNote: "You receive this daily summary because you're an InMailly team leader or admin.",
  });
}
