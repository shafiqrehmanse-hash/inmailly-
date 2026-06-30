import Link from "next/link";
import StatCard from "@/components/team/StatCard";
import TeamProgressChart from "@/components/team/TeamProgressChart";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

export default async function HubPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const supabase = createServerSupabase();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const cutoff = fourteenDaysAgo.toISOString();

  const [pool, myActive, iUsed, myLeads, refCount, leadDatesRes, linkDatesRes] =
    await Promise.all([
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id)
      .eq("status", "claimed"),
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("used_by_member_id", member.id)
      .eq("status", "used"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id)
      .is("project_id", null),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", member.id),
    supabase
      .from("leads")
      .select("created_at")
      .eq("member_id", member.id)
      .gte("created_at", cutoff),
    supabase
      .from("outreach_links")
      .select("used_at")
      .eq("used_by_member_id", member.id)
      .eq("status", "used")
      .not("used_at", "is", null)
      .gte("used_at", cutoff),
  ]);

  const avail = pool.count || 0;
  const leads = myLeads.count || 0;
  const referred = refCount.count || 0;
  const leadDates = (leadDatesRes.data || []).map((r) => r.created_at as string);
  const linkDates = (linkDatesRes.data || [])
    .map((r) => r.used_at as string | null)
    .filter((d): d is string => Boolean(d));

  const quickNav = [
    {
      href: "/team/scripts",
      label: "Scripts",
      icon: "📋",
      desc: "Copy Add Note and InMail — subject and message separate.",
      go: "Open scripts →",
      featured: true,
    },
    {
      href: "/team/links",
      label: "Work Links",
      icon: "⛓",
      desc: `${avail} profiles ready — claim, open, mark used.`,
      go: "Open links →",
    },
    {
      href: "/team/leads",
      label: "My Leads",
      icon: "◫",
      desc: "Add and track everyone who responds to your outreach.",
      go: `${leads} leads →`,
    },
    {
      href: "/team/responses",
      label: "Responses",
      icon: "💬",
      desc: "Leads who replied or showed interest.",
      go: "View replies →",
    },
    {
      href: "/team/referrals",
      label: "Earn & Refer",
      icon: "✦",
      desc: "Share your link — earn when referrals close deals.",
      go: `${referred} referred →`,
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lux-violet/80 mb-2">
          Team workspace
        </p>
        <h1 className="font-bricolage font-extrabold text-[clamp(1.6rem,4vw,2.15rem)] tracking-tight">
          <span className="lux-gradient-text">Welcome back, {member.name}</span>
          <span className="text-lux-text"> 👋</span>
        </h1>
        <p className="text-lux-muted text-[0.92rem] mt-2 max-w-xl leading-relaxed">
          Open <strong className="text-lux-violet font-semibold">Scripts</strong> to copy outreach copy,
          then jump into a section below.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {quickNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-5 flex flex-col gap-2 min-h-[130px] transition-all duration-300 group ${
              item.featured
                ? "lux-card-featured hover:shadow-[0_0_56px_rgba(34,211,238,0.1)]"
                : "lux-card-elite hover:border-lux-violet/30 hover:shadow-[0_0_32px_rgba(139,92,246,0.08)]"
            }`}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="font-bricolage font-extrabold text-lux-text group-hover:text-lux-cyan transition-colors">
              {item.label}
            </div>
            <p className="text-[0.8rem] text-lux-muted leading-relaxed flex-1">{item.desc}</p>
            <span className="text-[0.72rem] font-bold text-lux-cyan">{item.go}</span>
          </Link>
        ))}
      </div>

      <div className="lux-card-elite p-5 sm:p-6 border-lux-violet/15">
        <div className="text-[0.68rem] font-bold uppercase tracking-widest text-lux-violet mb-2">
          Recommended workflow
        </div>
        <p className="text-[0.9rem] text-lux-muted leading-relaxed">
          <strong className="text-lux-cyan">1.</strong> Copy script →{" "}
          <strong className="text-lux-cyan">2.</strong> Work Links →{" "}
          <strong className="text-lux-cyan">3.</strong> Run outreach →{" "}
          <strong className="text-lux-cyan">4.</strong> Mark used →{" "}
          <strong className="text-lux-cyan">5.</strong> Log leads
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={avail} label="Links available" />
        <StatCard value={myActive.count || 0} label="Your active" />
        <StatCard value={iUsed.count || 0} label="Marked used" />
        <StatCard value={leads} label="Your leads" />
      </div>

      <TeamProgressChart leadDates={leadDates} linkDates={linkDates} />
    </div>
  );
}
