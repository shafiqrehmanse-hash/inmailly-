import Link from "next/link";
import { getContractDashboardPath, getInfoDocDashboardPath } from "@/lib/roles";
import { getPendingContractForMember, getPendingInfoDocForMember } from "@/lib/team-pending-actions";
import type { TeamMember } from "@/lib/types";
import type { OfferLetterForm } from "@/lib/offer-letter";

export default async function TeamPendingActionsBanner({ member }: { member: TeamMember }) {
  const [pendingContract, pendingInfoDoc] = await Promise.all([
    getPendingContractForMember(member),
    getPendingInfoDocForMember(member),
  ]);

  if (!pendingContract && !pendingInfoDoc) return null;

  const contractHref = getContractDashboardPath(member.role);
  const infoDocHref = getInfoDocDashboardPath(member.role);
  const roleTitle = pendingContract
    ? ((pendingContract.form_data as OfferLetterForm)?.roleTitle || "employment offer")
    : null;

  return (
    <div className="space-y-2 mb-5">
      {pendingContract && (
        <Link
          href={contractHref}
          className="block rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/[0.14] via-red-600/[0.08] to-transparent px-4 py-3.5 sm:px-5 sm:py-4 shadow-[0_0_28px_rgba(239,68,68,0.12)] hover:border-red-400/70 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span
              className="admin-alert-dot shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)] mt-1.5"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-red-400 mb-0.5">
                Action required — sign offer letter
              </p>
              <p className="font-bricolage font-bold text-[0.95rem] sm:text-base text-red-200 leading-snug">
                Review and sign your {roleTitle} offer now →
              </p>
              <p className="text-[0.72rem] text-red-300/80 mt-0.5">
                Ref {pendingContract.reference_no} · This stays at the top until you sign
              </p>
            </div>
          </div>
        </Link>
      )}

      {pendingInfoDoc && (
        <Link
          href={infoDocHref}
          className="block rounded-xl border border-amber-500/45 bg-gradient-to-r from-amber-500/[0.12] via-amber-600/[0.06] to-transparent px-4 py-3.5 sm:px-5 hover:border-amber-400/60 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0" aria-hidden>
              📋
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-amber-400 mb-0.5">
                Action required — Info Doc
              </p>
              <p className="font-bricolage font-bold text-[0.95rem] sm:text-base text-amber-200 leading-snug">
                Complete your employee Info Doc →
              </p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
