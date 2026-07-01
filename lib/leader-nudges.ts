export type NudgeTemplateKey = "stale_links" | "inactive" | "pool_available";

export const NUDGE_TEMPLATES: Record<
  NudgeTemplateKey,
  { label: string; subject: string; buildBody: (ctx: NudgeContext) => string }
> = {
  stale_links: {
    label: "Stale links reminder",
    subject: "Please finish or release your claimed links",
    buildBody: ({ leaderName, memberName, staleCount }) =>
      `Hi ${memberName},

You have ${staleCount} claimed link${staleCount === 1 ? "" : "s"} sitting idle for 48+ hours. Please finish outreach on them or release them back to the pool so the team can keep moving.

Thanks for staying on top of it.

${leaderName}
Team Leader, InMailly`,
  },
  inactive: {
    label: "Inactive check-in",
    subject: "Quick check-in — team workspace",
    buildBody: ({ leaderName, memberName, poolCount }) =>
      `Hi ${memberName},

We haven't seen you in the workspace in the last 24 hours. When you have a moment, log in and pick up work — there ${poolCount === 1 ? "is" : "are"} ${poolCount} link${poolCount === 1 ? "" : "s"} available in the pool right now.

Let me know if anything is blocking you.

${leaderName}
Team Leader, InMailly`,
  },
  pool_available: {
    label: "Pool has links",
    subject: "Links are available — grab a batch",
    buildBody: ({ leaderName, memberName, poolCount }) =>
      `Hi ${memberName},

The link pool has ${poolCount} profile${poolCount === 1 ? "" : "s"} ready to claim. Please grab a batch and keep outreach moving today.

${leaderName}
Team Leader, InMailly`,
  },
};

export type NudgeContext = {
  leaderName: string;
  memberName: string;
  staleCount?: number;
  poolCount?: number;
};

export function nudgeHtmlBody(text: string) {
  const paragraphs = text
    .split("\n\n")
    .map((p) => p.replace(/\n/g, "<br/>"))
    .map((html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#a1a1aa;">${html}</p>`)
    .join("");
  return paragraphs;
}
