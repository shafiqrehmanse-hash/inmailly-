import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] h-16 flex items-center justify-between px-5 lg:px-12 bg-white/88 backdrop-blur-xl border-b border-line">
      <div className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-ind to-ind2 flex items-center justify-center font-bricolage font-extrabold text-sm text-white shadow-[0_2px_8px_rgba(67,56,202,.3)]">
          I
        </div>
        <span className="font-bricolage font-extrabold text-xl tracking-tight text-ink">
          InMailly
        </span>
      </div>
      <ul className="hidden md:flex gap-1 list-none">
        {[
          { href: "#pricing", label: "Pricing" },
          { href: "#features", label: "Features" },
          { href: "#how", label: "How it works" },
          { href: "#dashboard", label: "Dashboard" },
        ].map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="px-3.5 py-1.5 rounded-lg text-[0.83rem] font-medium text-mid hover:text-ink hover:bg-off transition-all"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2.5">
        <Link href="/login" className="btn-ghost px-4 py-2 text-[0.82rem] font-semibold">
          Sign in
        </Link>
        <Link href="/register" className="btn-primary px-5 py-2 text-[0.82rem]">
          Get started →
        </Link>
      </div>
    </nav>
  );
}
