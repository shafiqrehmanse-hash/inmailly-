import Link from "next/link";
import { getCurrentMember } from "@/lib/team";

export default async function CampaignOutreachHubPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const quickNav = [
    { href: "/campaign/outreach/scripts", label: "Scripts", icon: "📋", desc: "Copy Add Note and InMail templates." },
    { href: "/campaign/outreach/links", label: "Work links", icon: "⛓", desc: "Claim profiles, mark used, auto-assign." },
    { href: "/campaign/outreach/leads", label: "My leads", icon: "◫", desc: "Log everyone who responds." },
    { href: "/campaign/outreach/responses", label: "Responses", icon: "💬", desc: "Inbound threads from outreach." },
  ];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lux-violet/80 mb-2">
          InMailly outreach
        </p>
        <h1 className="font-bricolage font-extrabold text-[clamp(1.5rem,4vw,2rem)] tracking-tight text-lux-text">
          Outreach workspace
        </h1>
        <p className="text-lux-muted text-[0.92rem] mt-2 max-w-xl leading-relaxed">
          Same tools as outreach workers — separate from team leaders. Client campaigns stay under{" "}
          <Link href="/campaign/hub" className="text-lux-cyan hover:underline">
            Client management
          </Link>
          .
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {quickNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="lux-card-elite p-5 flex flex-col gap-2 min-h-[120px] hover:border-lux-cyan/30 transition-colors"
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="font-bricolage font-extrabold text-lux-text">{item.label}</div>
            <p className="text-[0.8rem] text-lux-muted flex-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
