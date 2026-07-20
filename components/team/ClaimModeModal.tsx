"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ClaimModeModal({
  open,
  onClose,
  onChoose,
  intelligenceAvailable,
  intelligenceBlocked,
  intelligenceBlockMessage,
  checking,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (mode: "intelligence" | "usual") => void;
  intelligenceAvailable: number | null;
  intelligenceBlocked?: boolean;
  intelligenceBlockMessage?: string | null;
  checking?: boolean;
}) {
  const noIntel = intelligenceAvailable === 0;
  const finishFirst = Boolean(intelligenceBlocked);

  return (
    <Modal open={open} onClose={onClose} title="How do you want to work this link?">
      <div className="space-y-4">
        <p className="text-sm text-lux-muted leading-relaxed">
          Prefer using <strong className="text-lux-text">Get Usual / Get Intelligence</strong> buttons above for
          batches. Or claim this one link now.
        </p>

        {finishFirst && (
          <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/15 px-4 py-3 text-sm text-amber-100 font-semibold leading-relaxed">
            {intelligenceBlockMessage ||
              "You already have Intelligence links. Please finish those first before claiming more."}
          </div>
        )}

        {noIntel && !finishFirst && (
          <div className="rounded-xl border-2 border-red-500/50 bg-red-500/15 px-4 py-3 text-sm text-red-200 font-semibold leading-relaxed">
            No intelligence links in the pool right now. Ask admin to upload links with{" "}
            <span className="text-red-100">First name, Last name, LinkedIn URL</span>. You can still use Usual
            outreach.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={checking || noIntel || finishFirst}
            onClick={() => onChoose("intelligence")}
            className={`text-left rounded-2xl border p-4 transition-all ${
              noIntel || finishFirst
                ? "border-red-500/30 bg-red-500/5 opacity-60 cursor-not-allowed"
                : "border-lux-cyan/40 bg-lux-cyan/10 hover:border-lux-cyan hover:bg-lux-cyan/15"
            }`}
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">✦ Recommended</p>
            <p className="font-bricolage font-extrabold text-lux-text text-lg">Intelligence</p>
            <p className="text-xs text-lux-muted mt-2 leading-relaxed">
              Open profile → paste screenshot → AI writes custom subject + InMail → send → mark complete.
            </p>
            {intelligenceAvailable != null && intelligenceAvailable > 0 && !finishFirst && (
              <p className="text-[0.7rem] text-lux-cyan mt-2 tabular-nums">
                {intelligenceAvailable} named link{intelligenceAvailable === 1 ? "" : "s"} ready
              </p>
            )}
          </button>

          <button
            type="button"
            disabled={checking}
            onClick={() => onChoose("usual")}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/25 hover:bg-white/[0.06] transition-all"
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-muted mb-1">Classic</p>
            <p className="font-bricolage font-extrabold text-lux-text text-lg">Usual</p>
            <p className="text-xs text-lux-muted mt-2 leading-relaxed">
              Same as before — open the profile and use team scripts manually.
            </p>
          </button>
        </div>

        <Button variant="lux-ghost" className="w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
