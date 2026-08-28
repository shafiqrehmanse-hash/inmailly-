import Link from "next/link";
import { formatDate } from "@/lib/utils";

export type ReferralPerson = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  is_active?: boolean | null;
  phone?: string | null;
};

export default function TeamReferralPeopleCard({ people }: { people: ReferralPerson[] }) {
  if (!people.length) return null;

  return (
    <div className="lux-card-elite p-5 border-amber-500/20">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-amber-300 mb-1">
            Your referral team
          </p>
          <h2 className="font-bricolage font-extrabold text-lg text-lux-text">
            {people.length} {people.length === 1 ? "person" : "people"} joined with your link
          </h2>
        </div>
        <Link href="/team/referrals" className="text-xs font-semibold text-lux-cyan hover:underline">
          Earn & Refer →
        </Link>
      </div>
      <ul className="space-y-2">
        {people.slice(0, 12).map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-semibold text-lux-text truncate">{p.name}</p>
              <p className="text-xs text-lux-muted truncate">{p.email}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-amber-200/90">
                {p.status}
                {p.is_active === false ? " · inactive" : ""}
              </p>
              <p className="text-[0.62rem] text-lux-muted">{formatDate(p.created_at)}</p>
            </div>
          </li>
        ))}
      </ul>
      {people.length > 12 && (
        <p className="text-xs text-lux-muted mt-3">
          +{people.length - 12} more on{" "}
          <Link href="/team/referrals" className="text-lux-cyan hover:underline">
            Earn & Refer
          </Link>
        </p>
      )}
    </div>
  );
}
