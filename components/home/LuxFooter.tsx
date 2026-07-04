import Link from "next/link";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#product", label: "Product" },
  { href: "/blog", label: "Blog" },
  { href: "#pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function LuxFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-lux-bg2 py-16">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
        <div>
          <InMaillyBrand size="sm" />
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
