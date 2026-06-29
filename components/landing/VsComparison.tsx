const rows = [
  { label: "Budget spent", bad: "$100", good: "$275" },
  { label: "Messages sent", bad: "15 InMail credits", good: "1,000 sends" },
  { label: "Cost per message", bad: "$6.67", good: "$0.275" },
  { label: "Reply tracking", bad: "None", good: "Full dashboard" },
  { label: "Setup time", bad: "3–5 days approval", good: "48 hours" },
  { label: "Lead pipeline", bad: "No", good: "Built-in CRM" },
  { label: "Account restrictions", bad: "Platform limits apply", good: "None — human operated" },
];

export default function VsComparison() {
  return (
    <section className="py-20 px-5 lg:px-12 bg-white">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.65rem] font-bold uppercase tracking-widest text-ind mb-3 flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-ind" />
            The honest comparison
            <span className="w-6 h-px bg-ind" />
          </div>
          <h2 className="font-bricolage font-extrabold text-[clamp(1.8rem,4vw,2.8rem)] tracking-tight text-ink">
            Stop overpaying for 15 InMail credits.
          </h2>
        </div>

        <div className="border-[1.5px] border-line2 rounded-[20px] overflow-hidden shadow-sm">
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr] bg-off border-b-[1.5px] border-line2">
            <div className="p-4 text-[0.72rem] font-bold uppercase tracking-wide text-dim">
              What you&apos;re comparing
            </div>
            <div className="p-4 text-[0.72rem] font-bold uppercase tracking-wide text-red border-l border-line2 bg-red/[0.03]">
              ❌ LinkedIn Ads / InMail
            </div>
            <div className="p-4 text-[0.72rem] font-bold uppercase tracking-wide text-ind border-l border-line2 bg-ind/[0.04]">
              ✓ InMailly
            </div>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[2fr_1.5fr_1.5fr] border-b border-line last:border-0 hover:bg-off transition-colors"
            >
              <div className="p-4 text-[0.88rem] font-medium text-mid flex items-center">
                {row.label}
              </div>
              <div className="p-4 text-[0.88rem] font-bold font-bricolage text-red border-l border-line bg-red/[0.02] flex items-center">
                {row.bad}
              </div>
              <div className="p-4 text-[0.88rem] font-bold font-bricolage text-ind border-l border-line bg-ind/[0.02] flex items-center">
                {row.good}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[2fr_3fr] bg-gradient-to-r from-ind/[0.04] to-sky/[0.04] border-t-[1.5px] border-ind/15">
            <div className="p-4 text-[0.85rem] text-mid font-medium border-r border-line flex items-center">
              Bottom line
            </div>
            <div className="p-4 text-[0.85rem] text-ind font-bold flex items-center gap-2">
              ⚡ InMailly delivers <strong>24× more messages</strong> for less money — with a full pipeline to track every reply.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
