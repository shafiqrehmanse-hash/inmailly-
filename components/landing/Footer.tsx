import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink px-5 lg:px-12 py-10">
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-5">
        <div className="font-bricolage font-extrabold text-lg text-white">InMailly</div>
        <ul className="flex gap-6 list-none">
          {[
            { href: "#pricing", label: "Pricing" },
            { href: "#features", label: "Features" },
            { href: "/login", label: "Login" },
            { href: "#", label: "Privacy" },
          ].map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="text-[0.78rem] text-white/40 hover:text-white transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="text-[0.72rem] text-white/30">
          © 2026 InMailly. LinkedIn outreach at scale.
        </div>
      </div>
    </footer>
  );
}
