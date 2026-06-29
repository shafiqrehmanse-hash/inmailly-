import Link from "next/link";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#product", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function LuxFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-lux-bg2 py-16">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-lux-blue/40 bg-lux-blue/10 flex items-center justify-center font-bricolage font-extrabold text-xs text-lux-blue">
              I
            </div>
            <span className="font-bricolage font-extrabold text-lg text-lux-text">InMailly</span>
          </div>
          <p className="text-sm text-lux-muted mt-3 max-w-xs">
            Premium LinkedIn outreach infrastructure for teams that scale.
          </p>
        </div>

        <ul className="flex flex-wrap gap-8">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm text-lux-muted hover:text-lux-cyan transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-[0.7rem] text-lux-muted/60">© 2026 InMailly. All rights reserved.</p>
      </div>
    </footer>
  );
}
