type Leader = { id: string; name: string; email: string };

export default function TeamLeadersCard({ leaders }: { leaders: Leader[] }) {
  if (!leaders.length) return null;

  return (
    <div className="lux-card-elite p-5 border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-400 text-lg" aria-hidden>
          ★
        </span>
        <h2 className="text-[0.68rem] font-bold uppercase tracking-widest text-amber-300/90">
          Your team leader{leaders.length === 1 ? "" : "s"}
        </h2>
      </div>
      <ul className="space-y-2">
        {leaders.map((leader) => (
          <li
            key={leader.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3"
          >
            <div>
              <p className="font-semibold text-lux-text">{leader.name}</p>
              <p className="text-[0.68rem] text-amber-200/70 uppercase tracking-wider font-bold mt-0.5">
                Team leader
              </p>
            </div>
            <a
              href={`mailto:${leader.email}`}
              className="text-xs font-semibold text-lux-cyan hover:text-lux-text transition-colors"
            >
              Email →
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
