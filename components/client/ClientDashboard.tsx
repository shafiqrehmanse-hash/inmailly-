"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DEMO_ACTIVITY,
  DEMO_CAMPAIGN,
  DEMO_RESPONSES,
  PIPELINE_STAGES,
} from "@/lib/client-demo";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";
import ProofLightbox, { ProofThumb } from "@/components/proof/ProofLightbox";
import ClientResponseModal, { type ClientResponseDetail } from "@/components/client/ClientResponseModal";
import { cn } from "@/lib/utils";
import {
  HiArrowTrendingUp,
  HiBolt,
  HiChartBar,
  HiEnvelope,
  HiInbox,
  HiPaperAirplane,
  HiSquares2X2,
} from "react-icons/hi2";

type Tab = "overview" | "responses" | "sends" | "campaigns" | "analytics";

function TeamVisibleCount({
  visible,
  team,
  singular,
  plural,
}: {
  visible: number;
  team?: number;
  singular: string;
  plural: string;
}) {
  const teamTotal = team ?? visible;
  const differs = teamTotal > visible;
  const label = visible === 1 ? singular : plural;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn(differs && "text-red-400 font-semibold", "tabular-nums")}>{visible}</span>
      <span>{label}</span>
      {differs && <span className="text-lux-muted/60 tabular-nums">/ {teamTotal} logged</span>}
    </span>
  );
}

const TABS: { id: Tab; label: string; icon: typeof HiSquares2X2 }[] = [
  { id: "overview", label: "Overview", icon: HiSquares2X2 },
  { id: "responses", label: "Responses", icon: HiInbox },
  { id: "sends", label: "Send proofs", icon: HiPaperAirplane },
  { id: "campaigns", label: "Campaigns", icon: HiEnvelope },
  { id: "analytics", label: "Analytics", icon: HiChartBar },
];

export default function ClientDashboard({
  mode = "full",
  className = "",
  live,
  usingDemoFill = false,
  onFollowupSaved,
}: {
  mode?: "hero" | "full";
  className?: string;
  live?: ClientDashboardLiveData;
  /** Sample campaign metrics until real responses/proofs exist (client login only). */
  usingDemoFill?: boolean;
  onFollowupSaved?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [activityIdx, setActivityIdx] = useState(0);
  const [sent, setSent] = useState(DEMO_CAMPAIGN.sent);
  const [proofLightbox, setProofLightbox] = useState<string | null>(null);
  const [responseModal, setResponseModal] = useState<ClientResponseDetail | null>(null);
  const [localFollowups, setLocalFollowups] = useState<
    Record<string, { clientFollowupMessage: string; clientFollowupAt: string }>
  >({});
  const isHero = mode === "hero";
  const isLive = Boolean(live);
  const isPreviewLive = isLive && live!.status === "preview" && !usingDemoFill;

  useEffect(() => {
    if (isLive) return;
    const t1 = setInterval(() => setActivityIdx((i) => (i + 1) % DEMO_ACTIVITY.length), 3200);
    const t2 = setInterval(() => setSent((s) => s + (Math.random() > 0.6 ? 1 : 0)), 2800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [isLive]);

  const activity = isLive
    ? live!.latestActivity || { name: "—", action: "Waiting for first response", time: "—" }
    : DEMO_ACTIVITY[activityIdx];

  const displayResponses = isLive
    ? live!.responses.map((r) => {
        const patch = localFollowups[r.id];
        return patch
          ? { ...r, clientFollowupMessage: patch.clientFollowupMessage, clientFollowupAt: patch.clientFollowupAt }
          : r;
      })
    : DEMO_RESPONSES;

  function openResponse(r: ClientResponseDetail) {
    setResponseModal(r);
  }

  function handleFollowupSaved(updated: Pick<ClientResponseDetail, "id" | "clientFollowupMessage" | "clientFollowupAt">) {
    if (updated.clientFollowupMessage && updated.clientFollowupAt) {
      setLocalFollowups((prev) => ({
        ...prev,
        [updated.id]: {
          clientFollowupMessage: updated.clientFollowupMessage!,
          clientFollowupAt: updated.clientFollowupAt!,
        },
      }));
      setResponseModal((cur) =>
        cur?.id === updated.id
          ? {
              ...cur,
              clientFollowupMessage: updated.clientFollowupMessage,
              clientFollowupAt: updated.clientFollowupAt,
            }
          : cur
      );
    }
    onFollowupSaved?.();
  }

  return (
    <div
      className={`relative z-10 border border-white/[0.08] bg-lux-card/95 backdrop-blur-xl overflow-visible shadow-[0_0_80px_rgba(37,99,235,0.12)] min-h-[480px] ${className}`}
    >
      <div className="flex items-center justify-between px-4 lg:px-5 py-2.5 border-b border-white/[0.06] bg-lux-bg2/90">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400/80" />
          <div className="w-2 h-2 rounded-full bg-amber-400/80" />
          <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
        </div>
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-lux-muted font-medium">
          InMailly · Client Command
        </span>
        <div className="flex items-center gap-1.5 text-emerald-400 text-[0.6rem] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className={`flex ${isHero ? "flex-col" : "flex-col lg:flex-row"} min-h-0`}>
        {!isHero && (
          <aside className="lg:w-[200px] border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-lux-bg2/50 p-2 flex lg:flex-col gap-0.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-left text-[0.75rem] font-medium whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-lux-blue/15 text-lux-cyan border-l-2 border-lux-cyan"
                    : "text-lux-muted hover:text-lux-text hover:bg-white/[0.03]"
                }`}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            ))}
            <div className="hidden lg:block mt-auto p-3 border-t border-white/[0.06]">
              {isLive ? (
                <>
                  <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted">Campaign</div>
                  <div className="font-bricolage font-bold text-lux-cyan text-sm mt-0.5 capitalize">
                    {live!.status}
                  </div>
                  <div className="text-[0.6rem] text-lux-muted truncate">{live!.clientLabel}</div>
                </>
              ) : (
                <>
                  <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted">Sample data</div>
                  <div className="font-bricolage font-bold text-lux-cyan text-sm mt-0.5">Demo preview</div>
                  <div className="text-[0.6rem] text-lux-muted">Create account for yours</div>
                </>
              )}
            </div>
          </aside>
        )}

        <div className="flex-1 p-4 lg:p-5 space-y-4 min-w-0">
          {isLive ? (
            usingDemoFill ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border border-violet-500/25 bg-violet-500/5 px-3 py-2">
                <span className="text-[0.65rem] text-violet-300 font-semibold uppercase tracking-wider">
                  Sample campaign view · {live!.projectName}
                </span>
                <span className="text-[0.65rem] text-lux-muted">
                  Real stats replace this when your team logs responses &amp; send proofs
                </span>
              </div>
            ) : (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border px-3 py-2 ${
                isPreviewLive
                  ? "border-lux-cyan/25 bg-lux-cyan/5"
                  : "border-emerald-500/25 bg-emerald-500/5"
              }`}
            >
              <span
                className={`text-[0.65rem] font-semibold uppercase tracking-wider ${
                  isPreviewLive ? "text-lux-cyan" : "text-emerald-400"
                }`}
              >
                {isPreviewLive ? "Preview dashboard" : "Live campaign"} · {live!.projectName}
              </span>
              <span className="text-[0.65rem] text-lux-muted flex flex-wrap gap-x-3 gap-y-1">
                <TeamVisibleCount
                  visible={live!.stats.sends}
                  team={live!.stats.teamSends}
                  singular="InMail sent"
                  plural="InMails sent"
                />
                <span>·</span>
                <TeamVisibleCount
                  visible={live!.stats.total}
                  team={live!.stats.teamResponses}
                  singular="response"
                  plural="responses"
                />
              </span>
            </div>
            )
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 border border-lux-cyan/20 bg-lux-cyan/5 px-3 py-2">
              <span className="text-[0.65rem] text-lux-cyan font-semibold uppercase tracking-wider">
                Sample dashboard · demo data
              </span>
              <a href="/client/register" className="text-[0.65rem] text-lux-cyan hover:underline">
                Create your account →
              </a>
            </div>
          )}

          {(isHero || tab === "overview") && (
            <OverviewPanel
              sent={isLive ? live!.stats.sends : sent}
              teamSent={isLive ? live!.stats.teamSends : undefined}
              responseCount={isLive ? live!.stats.total : undefined}
              replyRate={isLive ? live!.stats.replyRate : DEMO_CAMPAIGN.replyRate}
              costPerMsg={DEMO_CAMPAIGN.costPerMsg}
              sentLabel={isLive ? "InMails sent" : "Sent"}
              activity={activity}
              pipeline={isLive ? live!.pipeline : PIPELINE_STAGES}
              velocity={isLive ? live!.velocity : undefined}
              isLive={isLive}
            />
          )}
          {!isHero && tab === "responses" && (
            <ResponsesPanel
              responses={displayResponses}
              visibleCount={isLive ? live!.stats.total : DEMO_RESPONSES.length}
              teamCount={isLive ? live!.stats.teamResponses : undefined}
              onSelect={openResponse}
            />
          )}
          {!isHero && tab === "sends" && (
            <SendsProofPanel
              proofs={isLive ? live!.proofs : []}
              visibleCount={isLive ? live!.stats.sends : 0}
              teamCount={isLive ? live!.stats.teamSends : undefined}
              onView={setProofLightbox}
              isLive={isLive}
              usingDemoFill={usingDemoFill}
            />
          )}
          {!isHero && tab === "campaigns" && (
            <CampaignsPanel
              name={isLive ? live!.projectName : DEMO_CAMPAIGN.name}
              status={isLive ? live!.status : DEMO_CAMPAIGN.status}
              audienceBrief={isLive ? live!.audienceBrief : null}
              targetTitles={isLive ? live!.targetTitles : null}
              stats={
                isLive
                  ? [
                      { l: "InMails", v: live!.stats.sends, team: live!.stats.teamSends },
                      { l: "Responses", v: live!.stats.total, team: live!.stats.teamResponses },
                      { l: "Hot", v: live!.stats.interested },
                      { l: "Reply rate", v: `${live!.stats.replyRate}%` },
                    ]
                  : [
                      { l: "Sent", v: sent },
                      { l: "Opened", v: DEMO_CAMPAIGN.opened },
                      { l: "Replied", v: DEMO_CAMPAIGN.replied },
                      { l: "Meetings", v: DEMO_CAMPAIGN.meetings },
                    ]
              }
            />
          )}
          {!isHero && tab === "analytics" && (
            <AnalyticsPanel live={isLive ? live! : undefined} />
          )}
        </div>
      </div>
      {proofLightbox && (
        <ProofLightbox src={proofLightbox} alt="InMail send proof" onClose={() => setProofLightbox(null)} />
      )}
      <ClientResponseModal
        response={responseModal}
        onClose={() => setResponseModal(null)}
        onSaved={handleFollowupSaved}
        readOnly={!isLive || usingDemoFill}
      />
    </div>
  );
}

function OverviewPanel({
  sent,
  teamSent,
  responseCount,
  replyRate,
  costPerMsg,
  sentLabel,
  activity,
  pipeline,
  velocity,
  isLive = false,
}: {
  sent: number;
  teamSent?: number;
  responseCount?: number;
  replyRate: number;
  costPerMsg: number;
  sentLabel: string;
  activity: { name: string; action: string; time: string };
  pipeline: { label: string; count: number; value: number }[];
  velocity?: number[];
  isLive?: boolean;
}) {
  const teamTotal = teamSent ?? sent;
  const sentDiffers = teamTotal > sent;
  const points =
    velocity && velocity.length > 1 ? velocity : [12, 22, 18, 35, 28, 45, 38, 55];
  const pathPoints = points
    .map((p, i) => {
      const denom = Math.max(1, points.length - 1);
      const x = (i / denom) * 300;
      const y = 70 - (p / 100) * 62;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const areaPath = `${pathPoints} L300,70 L0,70 Z`;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[
          {
            label: sentLabel,
            value: typeof sent === "number" ? sent.toLocaleString() : sent,
            teamValue: sentDiffers ? teamTotal : undefined,
            icon: HiPaperAirplane,
          },
          {
            label: "Reply rate",
            value: `${replyRate}%`,
            sub: isLive && responseCount !== undefined ? `${responseCount} responses` : undefined,
            icon: HiArrowTrendingUp,
          },
          isLive && responseCount !== undefined
            ? {
                label: "Responses",
                value: responseCount.toLocaleString(),
                icon: HiInbox,
              }
            : {
                label: "Cost / msg",
                value: `$${costPerMsg}`,
                icon: HiBolt,
              },
        ].map((m) => (
          <div key={m.label} className="border border-white/[0.06] bg-lux-bg2/60 p-2.5 lg:p-3">
            <m.icon className="w-3.5 h-3.5 text-lux-cyan mb-1.5 opacity-70" />
            <div
              className={cn(
                "font-bricolage font-extrabold text-lg lg:text-xl tabular-nums",
                m.teamValue ? "text-red-400" : "text-lux-text"
              )}
            >
              {m.value}
            </div>
            {m.teamValue !== undefined && (
              <div className="text-[0.5rem] text-lux-muted/70 tabular-nums">{m.teamValue} logged</div>
            )}
            {"sub" in m && m.sub && (
              <div className="text-[0.5rem] text-lux-muted/70">{m.sub}</div>
            )}
            <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="border border-white/[0.06] bg-lux-bg2/40 p-3 h-[120px] lg:h-[130px] relative overflow-hidden">
        <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted mb-2">Outreach velocity</div>
        <svg className="absolute bottom-3 left-3 right-3 h-[70px]" viewBox="0 0 300 70" preserveAspectRatio="none">
          <defs>
            <linearGradient id="clientChart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(37,99,235,0.45)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#clientChart)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.polyline
            points={points.map((p, i) => `${(i / Math.max(1, points.length - 1)) * 300},${70 - (p / 100) * 62}`).join(" ")}
            fill="none"
            stroke="rgba(34,211,238,0.85)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:gap-3">
        <div className="border border-white/[0.06] bg-lux-bg2/40 p-2.5 space-y-1.5">
          <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted">Pipeline</div>
          {pipeline.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <span className="text-[0.6rem] text-lux-muted w-12">{p.label}</span>
              <div className="flex-1 h-1 bg-white/[0.06]">
                <motion.div
                  className="h-full bg-gradient-to-r from-lux-blue to-lux-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${p.value}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <span className="text-[0.6rem] text-lux-text tabular-nums w-8">{p.count}</span>
            </div>
          ))}
        </div>
        <div className="border border-white/[0.06] bg-lux-bg2/40 p-2.5 min-h-[100px]">
          <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted mb-2">Live</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activity.name + activity.time}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-[0.7rem]"
            >
              <div className="font-semibold text-lux-text">{activity.name}</div>
              <div className="text-lux-muted text-[0.65rem] line-clamp-2">{activity.action}</div>
              <div className="text-lux-cyan text-[0.6rem] mt-0.5">{activity.time}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function SendsProofPanel({
  proofs,
  visibleCount,
  teamCount,
  onView,
  isLive,
  usingDemoFill = false,
}: {
  proofs: { id: string; image_url: string; time: string }[];
  visibleCount: number;
  teamCount?: number;
  onView: (url: string) => void;
  isLive: boolean;
  usingDemoFill?: boolean;
}) {
  const teamTotal = teamCount ?? visibleCount;
  const differs = teamTotal > visibleCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted">
          Verified InMail sends ·{" "}
          {usingDemoFill ? (
            "—"
          ) : (
            <>
              <span className={cn(differs && "text-red-400 font-semibold", "tabular-nums")}>{visibleCount}</span>
              {differs && <span className="text-lux-muted/60 normal-case"> / {teamTotal} logged</span>}
            </>
          )}
        </div>
        <span className="text-[0.6rem] text-lux-cyan border border-lux-cyan/25 px-2 py-0.5">
          HD proof
        </span>
      </div>
      {usingDemoFill ? (
        <div className="border border-violet-500/20 bg-violet-500/5 p-6 text-center text-sm text-lux-muted leading-relaxed">
          Send proof screenshots appear here once your campaign manager uploads them.
          Overview and responses above show sample data until then.
        </div>
      ) : !isLive ? (
        <div className="border border-white/[0.06] bg-lux-bg2/30 p-6 text-center text-sm text-lux-muted">
          Send proofs appear on live client campaigns after your team uploads screenshots.
        </div>
      ) : proofs.length === 0 ? (
        <div className="border border-white/[0.06] bg-lux-bg2/30 p-6 text-center text-sm text-lux-muted">
          No send proofs yet. Your campaign manager uploads Print Screen captures as they send InMails.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {proofs.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-2"
            >
              <ProofThumb
                src={p.image_url}
                alt={`InMail send proof ${i + 1}`}
                onClick={() => onView(p.image_url)}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[0.6rem] text-lux-muted px-0.5">
                <span>InMail sent</span>
                <span>{p.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponsesPanel({
  responses,
  visibleCount,
  teamCount,
  onSelect,
}: {
  responses: {
    id: string;
    name: string;
    title?: string;
    preview: string;
    time: string;
    status: string;
    unread?: boolean;
    profileUrl?: string | null;
    clientFollowupMessage?: string | null;
    clientFollowupAt?: string | null;
  }[];
  visibleCount?: number;
  teamCount?: number;
  onSelect?: (r: ClientResponseDetail) => void;
}) {
  const unread = responses.filter((r) => r.unread).length;
  const visible = visibleCount ?? responses.length;
  const teamTotal = teamCount ?? visible;
  const differs = teamTotal > visible;

  return (
    <div className="space-y-2">
      <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mb-2 flex flex-wrap gap-x-3">
        <span>
          Inbox ·{" "}
          <span className={cn(differs && "text-red-400 font-semibold", "tabular-nums")}>{visible}</span>
          {differs && <span className="text-lux-muted/60"> / {teamTotal} logged</span>}
        </span>
        <span>{unread} unread</span>
      </div>
      {responses.length === 0 ? (
        <div className="border border-white/[0.06] bg-lux-bg2/30 p-6 text-center text-sm text-lux-muted">
          No responses yet. Your team will log them here as they come in.
        </div>
      ) : (
        responses.map((r, i) => (
          <motion.button
            key={r.id}
            type="button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() =>
              onSelect?.({
                id: r.id,
                name: r.name,
                title: r.title,
                preview: r.preview,
                time: r.time,
                status: r.status,
                profileUrl: r.profileUrl ?? null,
                clientFollowupMessage: r.clientFollowupMessage ?? null,
                clientFollowupAt: r.clientFollowupAt ?? null,
              })
            }
            className={cn(
              "w-full text-left border p-3 transition-colors",
              r.unread ? "border-lux-cyan/30 bg-lux-cyan/5" : "border-white/[0.06] bg-lux-bg2/30",
              onSelect && "cursor-pointer hover:border-lux-cyan/40 hover:bg-lux-cyan/[0.07]"
            )}
          >
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-semibold text-sm text-lux-text">{r.name}</div>
                {r.title && <div className="text-[0.65rem] text-lux-muted">{r.title}</div>}
              </div>
              <span className="text-[0.55rem] uppercase tracking-wider px-2 py-0.5 h-fit bg-lux-blue/15 text-lux-cyan">
                {r.status}
              </span>
            </div>
            <p className="text-[0.75rem] text-lux-muted mt-2 line-clamp-2">{r.preview}</p>
            <div className="flex items-center justify-between mt-1">
              <div className="text-[0.6rem] text-lux-muted/70">{r.time}</div>
              <div className="flex items-center gap-2">
                {r.clientFollowupMessage && (
                  <span className="text-[0.55rem] uppercase tracking-wider text-emerald-400">Follow-up sent</span>
                )}
                {onSelect && (
                  <span className="text-[0.6rem] text-lux-cyan">
                    {r.clientFollowupMessage ? "View / edit →" : "Add follow-up →"}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        ))
      )}
    </div>
  );
}

function CampaignsPanel({
  name,
  status,
  audienceBrief,
  targetTitles,
  stats,
}: {
  name: string;
  status: string;
  audienceBrief: string | null;
  targetTitles: string | null;
  stats: { l: string; v: number | string; team?: number }[];
}) {
  return (
    <div className="border border-white/[0.06] bg-lux-bg2/40 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bricolage font-bold text-lux-text">{name}</h3>
          <p className="text-[0.7rem] text-lux-muted mt-1">Verified Sales Nav · Human-operated</p>
        </div>
        <span className="text-[0.6rem] uppercase text-emerald-400 border border-emerald-400/30 px-2 py-1 capitalize">
          {status}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-6">
        {stats.map((s) => {
          const differs = typeof s.v === "number" && s.team !== undefined && s.team > s.v;
          return (
            <div key={s.l} className="text-center border border-white/[0.06] py-3">
              <div
                className={cn(
                  "font-bricolage font-extrabold text-xl tabular-nums",
                  differs ? "text-red-400" : "text-lux-text"
                )}
              >
                {s.v}
              </div>
              {differs && (
                <div className="text-[0.5rem] text-lux-muted/70 tabular-nums">{s.team} logged</div>
              )}
              <div className="text-[0.55rem] uppercase text-lux-muted mt-1">{s.l}</div>
            </div>
          );
        })}
      </div>
      <p className="text-[0.7rem] text-lux-muted mt-4 border-t border-white/[0.06] pt-4">
        {audienceBrief ||
          (targetTitles
            ? `Targeting: ${targetTitles}`
            : "You provide target audience + InMail script. We deliver on verified LinkedIn accounts with Sales Navigator activated.")}
      </p>
    </div>
  );
}

function AnalyticsPanel({ live }: { live?: ClientDashboardLiveData }) {
  const items = live
    ? [
        {
          label: "InMails sent",
          value: String(live.stats.sends),
          sub:
            live.stats.teamSends && live.stats.teamSends > live.stats.sends
              ? `${live.stats.teamSends} logged by team`
              : "1 screenshot = 1 InMail",
        },
        {
          label: "Total responses",
          value: String(live.stats.total),
          sub: "Logged by your team",
        },
        {
          label: "Hot leads",
          value: String(live.stats.interested),
          sub: "Interested or replied",
        },
        {
          label: "Reply rate",
          value: `${live.stats.replyRate}%`,
          sub: "Responses ÷ InMails sent",
        },
        {
          label: "Target",
          value: live.targetTitles?.split(",")[0]?.trim() || "—",
          sub: live.targetTitles || "Audience from brief",
        },
      ]
    : [
        { label: "Best day", value: "Tuesday", sub: "14.2% reply rate" },
        { label: "Avg open time", value: "2.4h", sub: "From send to open" },
        { label: "Top industry", value: "B2B SaaS", sub: "38% of replies" },
        { label: "Meeting rate", value: "16%", sub: "From interested leads" },
      ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((a) => (
        <div key={a.label} className="border border-white/[0.06] bg-lux-bg2/40 p-4">
          <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted">{a.label}</div>
          <div className="font-bricolage font-extrabold text-2xl text-lux-text mt-1 truncate">{a.value}</div>
          <div className="text-[0.65rem] text-lux-cyan mt-1 line-clamp-2">{a.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function MockLinkedInThread({
  name,
  title,
  message,
  time,
  tag,
}: {
  name: string;
  title: string;
  message: string;
  time: string;
  tag: string;
}) {
  return (
    <div className="bg-[#1B1F23] border border-white/[0.08] overflow-hidden text-left">
      <div className="bg-[#283037] px-4 py-2.5 flex items-center justify-between border-b border-black/20">
        <span className="text-[0.7rem] font-semibold text-white/90">Messaging</span>
        <span className="text-[0.6rem] text-[#0A66C2] font-bold">in</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] shrink-0" />
          <div>
            <div className="font-semibold text-sm text-white">{name}</div>
            <div className="text-[0.65rem] text-white/50">{title}</div>
          </div>
        </div>
        <div className="bg-[#283037] rounded-lg rounded-tl-none p-3 ml-12 max-w-[90%]">
          <p className="text-[0.8rem] text-white/90 leading-relaxed">{message}</p>
          <div className="text-[0.6rem] text-white/40 mt-2">{time}</div>
        </div>
        <span className="inline-block ml-12 text-[0.55rem] uppercase tracking-wider px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {tag}
        </span>
      </div>
    </div>
  );
}

export function ScreenshotFrame({
  src,
  imageBase64,
  alt,
  children,
}: {
  src?: string;
  imageBase64?: string;
  alt: string;
  children?: React.ReactNode;
}) {
  const imgSrc = imageBase64 || src;
  if (imgSrc) {
    return (
      <div className="relative border border-white/[0.1] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <Image src={imgSrc} alt={alt} width={600} height={400} className="w-full h-auto" unoptimized={!!imageBase64} />
      </div>
    );
  }
  return <>{children}</>;
}
