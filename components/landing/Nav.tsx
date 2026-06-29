import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] h-16 flex items-center justify-between px-5 lg:px-10 bg-[rgba(4,5,15,0.7)] backdrop-blur-2xl border-b border-white/[0.05]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-indigo to-cyan flex items-center justify-center text-sm font-black">
          I
        </div>
        <span className="font-bricolage font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-white to-cyan2 bg-clip-text text-transparent">
          InMailly
        </span>
      </div>
      <ul className="hidden md:flex gap-0.5 list-none">
        {[
          { href: "#pricing", label: "Pricing" },
          { href: "#features", label: "Features" },
          { href: "#how", label: "How it works" },
          { href: "#dashboard", label: "Dashboard" },
        ].map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="px-3.5 py-1.5 rounded-lg text-[0.83rem] font-medium text-dim hover:text-white hover:bg-white/[0.06] transition-all"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="px-4 py-2 rounded-[9px] text-[0.8rem] font-semibold text-dim border border-white/10 hover:text-white hover:border-white/25 hover:bg-white/[0.04] transition-all"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 rounded-[9px] text-[0.8rem] font-bold text-white bg-gradient-to-br from-indigo to-indigo2 shadow-[0_4px_16px_rgba(79,70,229,0.35)] hover:-translate-y-px transition-all"
        >
          Start for free →
        </Link>
      </div>
    </nav>
  );
}
