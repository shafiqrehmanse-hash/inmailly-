import Link from "next/link";
import StatCard from "@/components/team/StatCard";
import HubFocusBanner from "@/components/team/HubFocusBanner";
import LeaderTeamSnapshot from "@/components/team/LeaderTeamSnapshot";
import TeamLeadersCard from "@/components/team/TeamLeadersCard";
import TeamReferralPeopleCard from "@/components/team/TeamReferralPeopleCard";
import TeamPerformancePodium from "@/components/team/TeamPerformancePodium";
import TeamProgressChart from "@/components/team/TeamProgressChart";
import TeamContractHubCard from "@/components/team/TeamContractHubCard";
import TeamInfoDocHubCard from "@/components/team/TeamInfoDocHubCard";
import TeamWeeklyGoalBar from "@/components/team/TeamWeeklyGoalBar";
import WorkerTasksCard from "@/components/team/WorkerTasksCard";
import CampaignShiftCard from "@/components/team/CampaignShiftCard";
import { isTeamLeader } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

export default async function HubPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const admin = createAdminClient();
  // Workers only see their assigned team leader — not every leader in the company
  let visibleLeaders: { id: string; name: string; email: string; phone: string | null }[] = [];
  if (!isTeamLeader(member.role) && member.leader_id) {
    const { data: myLeader } = await admin
      .from("team_members")
      .select("id, name, email, phone")
      .eq("id", member.leader_id)
      .eq("role", "team_leader")
      .eq("is_active", true)
      .maybeSingle();
    if (myLeader) visibleLeaders = [myLeader];
  }

  const supabase = createServerSupabase();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const cutoff = fourteenDaysAgo.toISOString();

  const [pool, myActive, iUsed, myLeads, refCount, leadDatesRes, linkDatesRes, myReferrals] =
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
    admin
      .from("referrals")
      .select("id, referred_email, referred_name, status, created_at")
      .eq("referrer_id", member.id)
      .order("created_at", { ascending: false }),
  ]);

  const referralRows = myReferrals.data || [];
  const referredEmails = Array.from(
    new Set(
      referralRows
        .map((r) => (r.referred_email as string | null)?.toLowerCase().trim())
        .filter((e): e is string => Boolean(e))
    )
  );
  const { data: referredMembers } =
    referredEmails.length > 0
      ? await admin
          .from("team_members")
          .select("email, is_active, phone")
          .in("email", referredEmails)
      : { data: [] as { email: string; is_active: boolean; phone: string | null }[] };
  const referredByEmail = new Map(
    (referredMembers || []).map((m) => [m.email.toLowerCase(), m])
  );
  const referralPeople = referralRows.map((r) => {
    const email = String(r.referred_email || "").toLowerCase();
    const joined = referredByEmail.get(email);
    return {
      id: r.id as string,
      name: (r.referred_name as string) || email || "Unknown",
      email: String(r.referred_email || ""),
      status: String(r.status || "pending"),
      created_at: r.created_at as string,
      is_active: joined?.is_active ?? null,
      phone: joined?.phone ?? null,
    };
  });

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
    {
      href: "/team/sales-nav",
      label: "Sales Navigator",
      icon: "🧭",
      desc: "Request a Sales Navigator license — admin activates and emails you the key.",
      go: "Request license →",
    },
    {
      href: "/team/performance",
      label: "Team performance",
      icon: "📊",
      desc: "See the full leaderboard — deals, referral SDRs, and your rank.",
      go: "View board →",
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

      <TeamPerformancePodium currentMemberId={member.id} />

      <HubFocusBanner />

      <TeamContractHubCard />
      <TeamInfoDocHubCard />

      <TeamWeeklyGoalBar />

      <CampaignShiftCard />

      {isTeamLeader(member.role) && <LeaderTeamSnapshot />}

      {!isTeamLeader(member.role) && <WorkerTasksCard />}

      <TeamLeadersCard leaders={visibleLeaders} />

      <TeamReferralPeopleCard people={referralPeople} />

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
        <a
          href="/guides/InMailly-Team-Operating-Guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-lux-cyan hover:underline"
        >
          📄 Download full team operating guide (PDF)
        </a>
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
