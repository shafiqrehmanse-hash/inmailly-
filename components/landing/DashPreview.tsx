export default function DashPreview() {
  return (
    <section id="dashboard" className="py-[100px] px-5 lg:px-12 bg-white">
      <div className="max-w-[1100px] mx-auto text-center mb-14">
        <div className="section-kicker justify-center">Team workspace</div>
        <h2 className="section-title mt-3 mx-auto">
          Your whole operation,
          <br />
          one clean screen.
        </h2>
        <p className="text-[0.95rem] text-mid max-w-[500px] mx-auto mt-3">
          Links. Leads. Replies. Earnings. Every team member sees exactly what they need.
        </p>
      </div>

      <div className="max-w-[1040px] mx-auto rounded-[28px] overflow-hidden border-[1.5px] border-line2 shadow-[0_32px_80px_rgba(15,15,26,.12)]">
        <div className="bg-off border-b-[1.5px] border-line px-5 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
            <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
            <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-3 bg-white border border-line rounded-[7px] px-3.5 py-1.5 text-[0.7rem] text-dim flex items-center gap-2">
            <span className="text-green text-[0.65rem]">🔒</span>
            app.inmailly.com/team/links
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] min-h-[480px]">
          <div className="hidden lg:flex flex-col bg-ink2 border-r border-white/[0.07] py-5">
            <div className="px-[18px] pb-[18px] border-b border-white/[0.07] mb-3">
              <div className="font-bricolage font-extrabold text-[0.95rem] text-white">InMailly</div>
              <div className="text-[0.58rem] text-white/35 uppercase tracking-widest mt-0.5">Team workspace</div>
            </div>
            {[
              { section: "Main", items: [{ ic: "⌂", label: "Home" }, { ic: "⛓", label: "Work Links", badge: "31", on: true }, { ic: "◫", label: "My Leads" }] },
              { section: "Outreach", items: [{ ic: "💬", label: "Responses" }, { ic: "✦", label: "Earn & Refer" }] },
            ].map((grp) => (
              <div key={grp.section} className="px-2.5 mb-1">
                <div className="text-[0.55rem] font-bold uppercase tracking-widest text-white/20 px-2.5 py-2">{grp.section}</div>
                {grp.items.map((item) => (
                  <div key={item.label} className={`flex items-center gap-2 px-2.5 py-2 rounded-[9px] text-[0.78rem] mb-0.5 ${item.on ? "bg-ind2/20 text-white" : "text-white/40"}`}>
                    <span className="w-[18px] text-center">{item.ic}</span>
                    {item.label}
                    {item.badge && <span className="ml-auto bg-ind2/30 text-indigo-300 text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-auto px-[18px] pt-3.5 border-t border-white/[0.07] flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-ind to-sky flex items-center justify-center text-[0.7rem] font-extrabold text-white">D</div>
              <div>
                <div className="text-[0.75rem] text-white/60">Dania K.</div>
                <div className="text-[0.58rem] text-white/30">Outreach Member</div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-off">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="font-bricolage font-extrabold text-[1.1rem] text-ink">⛓ Work Links</div>
                <div className="text-[0.72rem] text-dim mt-0.5">Claim a profile, run outreach, mark used when done</div>
              </div>
              <div className="flex gap-2">
                <div className="px-3.5 py-1.5 rounded-lg text-[0.72rem] font-bold border-[1.5px] border-line2 text-mid bg-white">Export</div>
                <div className="px-3.5 py-1.5 rounded-lg text-[0.72rem] font-bold bg-ind text-white border border-ind">+ Add lead</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
              {["31|Pool", "4|My active", "22|I used", "9|My leads"].map((s) => {
                const [v, l] = s.split("|");
                return (
                  <div key={l} className="bg-white border border-line rounded-[10px] p-3.5 text-center">
                    <div className="font-bricolage font-extrabold text-xl text-ind">{v}</div>
                    <div className="text-[0.58rem] text-dimmer uppercase tracking-wide mt-1">{l}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex border-b-[1.5px] border-line mb-3.5">
              {["📥 Available (31)", "🎯 My active (4)", "✅ Used (22)"].map((t, i) => (
                <div key={t} className={`px-4 py-1.5 text-[0.72rem] font-semibold border-b-2 -mb-0.5 ${i === 0 ? "text-ind border-ind" : "text-dim border-transparent"}`}>{t}</div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {[
                { url: "linkedin.com/in/james-morrison-vp-growth", badge: "Available", cls: "bg-green-l text-green", btn: "🎯 Claim" },
                { url: "linkedin.com/sales/lead/ACwAAABq3Rs...", badge: "Claimed", cls: "bg-[#fef3c7] text-amber", btn: "✅ Mark used" },
                { url: "linkedin.com/in/sarah-chen-head-of-sales", badge: "Available", cls: "bg-green-l text-green", btn: "🎯 Claim" },
              ].map((row) => (
                <div key={row.url} className="bg-white border-[1.5px] border-line rounded-[10px] px-3.5 py-3 flex items-center gap-3 text-[0.75rem] hover:border-ind transition-colors">
                  <span className="opacity-50">💼</span>
                  <span className="flex-1 text-sky truncate">{row.url}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${row.cls}`}>{row.badge}</span>
                  <span className="px-2.5 py-1 rounded-[7px] text-[0.65rem] font-bold bg-ind-light border border-ind/20 text-ind">{row.btn}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
