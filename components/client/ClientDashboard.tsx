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
import {
  HiArrowTrendingUp,
  HiBolt,
  HiChartBar,
  HiEnvelope,
  HiInbox,
  HiSquares2X2,
} from "react-icons/hi2";

type Tab = "overview" | "responses" | "campaigns" | "analytics";

const TABS: { id: Tab; label: string; icon: typeof HiSquares2X2 }[] = [
  { id: "overview", label: "Overview", icon: HiSquares2X2 },
  { id: "responses", label: "Responses", icon: HiInbox },
  { id: "campaigns", label: "Campaigns", icon: HiEnvelope },
  { id: "analytics", label: "Analytics", icon: HiChartBar },
];

export default function ClientDashboard({
  mode = "full",
  className = "",
}: {
  mode?: "hero" | "full";
  className?: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [activityIdx, setActivityIdx] = useState(0);
  const [sent, setSent] = useState(DEMO_CAMPAIGN.sent);
  const isHero = mode === "hero";

  useEffect(() => {
    const t1 = setInterval(() => setActivityIdx((i) => (i + 1) % DEMO_ACTIVITY.length), 3200);
    const t2 = setInterval(() => setSent((s) => s + (Math.random() > 0.6 ? 1 : 0)), 2800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const activity = DEMO_ACTIVITY[activityIdx];

  return (
    <div
      className={`relative border border-white/[0.08] bg-lux-card/95 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.12)] ${className}`}
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
              <div className="text-[0.55rem] uppercase tracking-wider text-lux-muted">Free trial</div>
              <div className="font-bricolage font-bold text-lux-cyan text-lg mt-0.5">
                {DEMO_CAMPAIGN.trialRemaining}/{DEMO_CAMPAIGN.trialTotal}
              </div>
              <div className="text-[0.6rem] text-lux-muted">InMails remaining</div>
            </div>
          </aside>
        )}

        <div className="flex-1 p-4 lg:p-5 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-lux-cyan/20 bg-lux-cyan/5 px-3 py-2">
            <span className="text-[0.65rem] text-lux-cyan font-semibold uppercase tracking-wider">
              Free trial · 200 InMails
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 bg-white/[0.08] overflow-hidden">
                <motion.div
                  className="h-full bg-lux-cyan"
                  animate={{
                    width: `${((DEMO_CAMPAIGN.trialTotal - DEMO_CAMPAIGN.trialRemaining) / DEMO_CAMPAIGN.trialTotal) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[0.65rem] text-lux-muted tabular-nums">
                {DEMO_CAMPAIGN.trialRemaining} left
              </span>
            </div>
          </div>

          {(isHero || tab === "overview") && <OverviewPanel sent={sent} activity={activity} />}
          {!isHero && tab === "responses" && <ResponsesPanel />}
          {!isHero && tab === "campaigns" && <CampaignsPanel sent={sent} />}
          {!isHero && tab === "analytics" && <AnalyticsPanel />}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({
  sent,
  activity,
}: {
  sent: number;
  activity: (typeof DEMO_ACTIVITY)[0];
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[
          { label: "Sent", value: sent.toLocaleString(), icon: HiEnvelope },
          { label: "Reply rate", value: `${DEMO_CAMPAIGN.replyRate}%`, icon: HiArrowTrendingUp },
          { label: "Cost / msg", value: `$${DEMO_CAMPAIGN.costPerMsg}`, icon: HiBolt },
        ].map((m) => (
          <div key={m.label} className="border border-white/[0.06] bg-lux-bg2/60 p-2.5 lg:p-3">
            <m.icon className="w-3.5 h-3.5 text-lux-cyan mb-1.5 opacity-70" />
            <div className="font-bricolage font-extrabold text-lg lg:text-xl text-lux-text tabular-nums">
              {m.value}
            </div>
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
            d="M0,60 L40,48 L80,52 L120,30 L160,35 L200,18 L240,22 L280,12 L300,8 L300,70 L0,70 Z"
            fill="url(#clientChart)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.polyline
            points="0,60 40,48 80,52 120,30 160,35 200,18 240,22 280,12 300,8"
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
          {PIPELINE_STAGES.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <span className="text-[0.6rem] text-lux-muted w-10">{p.label}</span>
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
              key={activity.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-[0.7rem]"
            >
              <div className="font-semibold text-lux-text">{activity.name}</div>
              <div className="text-lux-muted text-[0.65rem]">{activity.action}</div>
              <div className="text-lux-cyan text-[0.6rem] mt-0.5">{activity.time}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function ResponsesPanel() {
  return (
    <div className="space-y-2">
      <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mb-2">
        Inbox · {DEMO_RESPONSES.filter((r) => r.unread).length} unread
      </div>
      {DEMO_RESPONSES.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`border p-3 ${
            r.unread ? "border-lux-cyan/30 bg-lux-cyan/5" : "border-white/[0.06] bg-lux-bg2/30"
          }`}
        >
          <div className="flex justify-between gap-2">
            <div>
              <div className="font-semibold text-sm text-lux-text">{r.name}</div>
              <div className="text-[0.65rem] text-lux-muted">{r.title}</div>
            </div>
            <span className="text-[0.55rem] uppercase tracking-wider px-2 py-0.5 h-fit bg-lux-blue/15 text-lux-cyan">
              {r.status}
            </span>
          </div>
          <p className="text-[0.75rem] text-lux-muted mt-2">{r.preview}</p>
          <div className="text-[0.6rem] text-lux-muted/70 mt-1">{r.time}</div>
        </motion.div>
      ))}
    </div>
  );
}

function CampaignsPanel({ sent }: { sent: number }) {
  return (
    <div className="border border-white/[0.06] bg-lux-bg2/40 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bricolage font-bold text-lux-text">{DEMO_CAMPAIGN.name}</h3>
          <p className="text-[0.7rem] text-lux-muted mt-1">Verified Sales Nav · Human-operated</p>
        </div>
        <span className="text-[0.6rem] uppercase text-emerald-400 border border-emerald-400/30 px-2 py-1">
          {DEMO_CAMPAIGN.status}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-6">
        {[
          { l: "Sent", v: sent },
          { l: "Opened", v: DEMO_CAMPAIGN.opened },
          { l: "Replied", v: DEMO_CAMPAIGN.replied },
          { l: "Meetings", v: DEMO_CAMPAIGN.meetings },
        ].map((s) => (
          <div key={s.l} className="text-center border border-white/[0.06] py-3">
            <div className="font-bricolage font-extrabold text-xl text-lux-text">{s.v}</div>
            <div className="text-[0.55rem] uppercase text-lux-muted mt-1">{s.l}</div>
          </div>
        ))}
      </div>
      <p className="text-[0.7rem] text-lux-muted mt-4 border-t border-white/[0.06] pt-4">
        You provide target audience + InMail script. We deliver on verified LinkedIn accounts with
        Sales Navigator activated.
      </p>
    </div>
  );
}

function AnalyticsPanel() {
  const items = [
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
          <div className="font-bricolage font-extrabold text-2xl text-lux-text mt-1">{a.value}</div>
          <div className="text-[0.65rem] text-lux-cyan mt-1">{a.sub}</div>
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
