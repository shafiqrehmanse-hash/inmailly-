const theirs = [
  { label: "Budget", val: "$100" },
  { label: "Messages sent", val: "15 credits" },
  { label: "Cost per message", val: "$6.67" },
  { label: "Reply tracking", val: "None" },
  { label: "Setup time", val: "3–5 days" },
  { label: "Lead pipeline", val: "No" },
];

const ours = [
  { label: "Budget", val: "$275" },
  { label: "Messages sent", val: "1,000 sends" },
  { label: "Cost per message", val: "$0.275" },
  { label: "Reply tracking", val: "Full dashboard" },
  { label: "Setup time", val: "48 hours" },
  { label: "Lead pipeline", val: "Built-in CRM" },
];

export default function VsComparison() {
  return (
    <div className="relative z-[1] px-5 lg:px-10 pt-10">
      <div className="max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] rounded-3xl overflow-hidden border border-white/[0.07]">
        <div className="p-8 bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.03]">
          <div className="text-[0.68rem] font-bold uppercase tracking-widest text-red-400/70 mb-5">
            ❌ &nbsp;LinkedIn Ads / InMail
          </div>
          <div className="flex flex-col gap-3.5">
            {theirs.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-baseline pb-3.5 border-b border-white/[0.05] text-sm last:border-0 last:pb-0"
              >
                <span className="text-dimmer text-[0.78rem]">{row.label}</span>
                <span className="font-bricolage font-bold text-red-400/85">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center bg-white/[0.02] border-x border-white/[0.05] px-5">
          <div className="w-11 h-11 rounded-full bg-card2 border border-white/10 flex items-center justify-center text-[0.72rem] font-extrabold text-dimmer">
            vs
          </div>
        </div>
        <div className="p-8 bg-gradient-to-br from-indigo/[0.12] to-cyan/[0.06]">
          <div className="text-[0.68rem] font-bold uppercase tracking-widest text-cyan2 mb-5">
            ✓ &nbsp;InMailly
          </div>
          <div className="flex flex-col gap-3.5">
            {ours.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-baseline pb-3.5 border-b border-white/[0.05] text-sm last:border-0 last:pb-0"
              >
                <span className="text-dimmer text-[0.78rem]">{row.label}</span>
                <span className="font-bricolage font-bold bg-gradient-to-r from-indigo2 to-cyan2 bg-clip-text text-transparent">
                  {row.val}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-cyan/15 flex items-center gap-2 text-[0.82rem] font-semibold text-cyan2">
            <span>⚡</span> 24× more messages for less money
          </div>
        </div>
      </div>
    </div>
  );
}
