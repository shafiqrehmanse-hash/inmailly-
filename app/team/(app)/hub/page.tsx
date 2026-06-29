import Link from "next/link";
import StatCard from "@/components/team/StatCard";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

export default async function HubPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const supabase = createServerSupabase();

  const [pool, myActive, iUsed, myLeads, refCount] = await Promise.all([
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
      .eq("member_id", member.id),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", member.id),
  ]);

  const avail = pool.count || 0;
  const leads = myLeads.count || 0;
  const referred = refCount.count || 0;

  const quickNav = [
    {
      href: "/team/links",
      label: "Work Links",
      icon: "⛓",
      desc: `${avail} profiles ready — claim, open, mark used.`,
      go: "Open links →",
      featured: true,
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
        <h1 className="font-bricolage font-extrabold text-[clamp(1.5rem,4vw,2rem)] tracking-tight text-white">
          Welcome back, {member.name} 👋
        </h1>
        <p className="text-white/45 text-[0.92rem] mt-2 max-w-xl leading-relaxed">
          Claim links, run outreach, log leads — your daily workflow in one place.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[18px] bg-ws-card2 border border-ws-border p-5 sm:p-6">
        <div className="text-[0.68rem] font-bold uppercase tracking-widest text-ws-cyan/85 mb-2">
          Recommended workflow
        </div>
        <p className="text-[0.9rem] text-white/70 leading-relaxed">
          <strong className="text-ws-cyan">1.</strong> Work Links →{" "}
          <strong className="text-ws-cyan">2.</strong> Run outreach →{" "}
          <strong className="text-ws-cyan">3.</strong> Mark used →{" "}
          <strong className="text-ws-cyan">4.</strong> Log leads
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={avail} label="Links available" />
        <StatCard value={myActive.count || 0} label="Your active" />
        <StatCard value={iUsed.count || 0} label="Marked used" />
        <StatCard value={leads} label="Your leads" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {quickNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`ws-card p-5 flex flex-col gap-2 min-h-[130px] hover:border-ws-ind/40 transition-all group ${
              item.featured ? "border-ws-ind/30" : ""
            }`}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="font-bricolage font-extrabold text-white group-hover:text-ws-cyan transition-colors">
              {item.label}
            </div>
            <p className="text-[0.8rem] text-white/40 leading-relaxed flex-1">{item.desc}</p>
            <span className="text-[0.72rem] font-bold text-ws-cyan">{item.go}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
