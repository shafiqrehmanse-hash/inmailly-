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
      href: "/team/branding",
      label: "Branding",
      icon: "◈",
      desc: "LinkedIn headlines, about text, PDF & cover downloads.",
      go: "Apply branding →",
    },
    {
      href: "/team/referrals",
      label: "Refer & earn",
      icon: "✦",
      desc: "Share your link — earn when referrals close deals.",
      go: `${referred} referred →`,
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-bricolage font-extrabold text-[clamp(1.5rem,4vw,2rem)] tracking-tight text-ink">
          Welcome back, {member.name}
        </h1>
        <p className="text-mid text-[0.92rem] mt-2 max-w-xl leading-relaxed">
          Your command center — outreach links, leads, branding, and earnings in one smooth
          workspace.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0a150d] to-[#152018] border border-green-500/25 p-5 sm:p-6 text-white">
        <div className="absolute -top-12 -right-8 w-48 h-48 rounded-full bg-green-500/10 pointer-events-none" />
        <div className="relative">
          <div className="text-[0.68rem] font-bold uppercase tracking-widest text-green-400/85 mb-2">
            Recommended workflow
          </div>
          <p className="text-[0.9rem] leading-relaxed">
            <strong className="text-green-400">1.</strong> Claim a link →{" "}
            <strong className="text-green-400">2.</strong> Run outreach on LinkedIn →{" "}
            <strong className="text-green-400">3.</strong> Mark <strong>Used</strong> →{" "}
            <strong className="text-green-400">4.</strong> Log them as a lead when they reply
          </p>
          <div className="flex flex-wrap gap-2 mt-3.5">
            {["Work Links", "→", "Daily Scripts", "→", "My Leads"].map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="bg-white/10 px-3 py-1.5 rounded-full text-[0.74rem] text-white/55"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
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
            className={`card-dark p-5 flex flex-col gap-2 min-h-[130px] hover:shadow-card hover:border-green-500/40 transition-all group ${
              item.featured ? "border-green-500/30 bg-gradient-to-b from-white to-green-50/30" : ""
            }`}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="font-bricolage font-extrabold text-ink group-hover:text-ind transition-colors">
              {item.label}
            </div>
            <p className="text-[0.8rem] text-mid leading-relaxed flex-1">{item.desc}</p>
            <span className="text-[0.72rem] font-bold text-green-700">{item.go}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
