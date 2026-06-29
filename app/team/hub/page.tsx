import Link from "next/link";
import StatCard from "@/components/team/StatCard";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

export default async function HubPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const supabase = createServerSupabase();

  const [pool, myActive, iUsed, myLeads] = await Promise.all([
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
  ]);

  const quickNav = [
    { href: "/team/links", label: "Work Links", icon: "⛓", desc: "Claim & work profiles" },
    { href: "/team/leads", label: "My Leads", icon: "◫", desc: "Track conversations" },
    { href: "/team/responses", label: "Responses", icon: "💬", desc: "Active replies" },
    { href: "/team/referrals", label: "Earn & Refer", icon: "✦", desc: "Referral earnings" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl tracking-tight text-ink">
          Welcome back, {member.name.split(" ")[0]}
        </h1>
        <p className="text-mid text-sm mt-1">Here&apos;s your outreach snapshot today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={pool.count || 0} label="Pool available" />
        <StatCard value={myActive.count || 0} label="My active" />
        <StatCard value={iUsed.count || 0} label="I used" />
        <StatCard value={myLeads.count || 0} label="My leads" />
      </div>

      <div className="card-dark p-6 bg-ind-light border-ind/20">
        <h2 className="font-bricolage font-bold mb-4">Your workflow</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {["Claim a link", "Send outreach", "Mark used", "Add as lead"].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-ind/15 border border-ind/25 flex items-center justify-center text-xs font-bold text-ind">
                {i + 1}
              </span>
              <span className="text-mid">{step}</span>
              {i < 3 && <span className="text-dimmer">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card-dark p-5 hover:shadow-card hover:border-ind/30 transition-all group"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-bricolage font-bold text-ink group-hover:text-ind transition-colors">
              {item.label}
            </div>
            <div className="text-sm text-mid mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
