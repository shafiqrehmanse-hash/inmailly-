export default function DashPreview() {
  return (
    <section id="dashboard" className="relative z-[1] py-[100px] px-5 lg:px-10 bg-bg">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-cyan2 mb-3">
          <span className="w-5 h-px bg-cyan2" />
          Team workspace
        </div>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-tight mb-4">
          Your whole operation,
          <br />
          one clean screen.
        </h2>
        <p className="text-[0.95rem] text-dim leading-relaxed max-w-[520px] mx-auto">
          Links. Leads. Replies. Earnings. Every team member sees exactly what they need and nothing they don&apos;t.
        </p>
      </div>

      <div className="max-w-[1040px] mx-auto mt-14 rounded-[20px] overflow-hidden border border-white/[0.08] shadow-[0_60px_120px_rgba(0,0,0,0.6)]">
        <div className="bg-[rgba(7,9,26,0.95)] px-5 py-3 flex items-center gap-3.5 border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
            <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
            <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4 bg-white/[0.04] border border-white/[0.07] rounded-[7px] px-3.5 py-1.5 text-[0.7rem] text-dimmer flex items-center gap-2">
            <span className="text-green-400 text-[0.65rem]">🔒</span>
            app.inmailly.com/team/links
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] min-h-[500px] bg-bg">
          <div className="hidden lg:flex flex-col bg-[#060818] border-r border-white/[0.05] py-5">
            <div className="px-[18px] pb-[18px] border-b border-white/[0.05] mb-3">
              <div className="font-bricolage font-extrabold text-[0.95rem] bg-gradient-to-r from-white to-cyan2 bg-clip-text text-transparent">
                InMailly
              </div>
              <div className="text-[0.58rem] text-dimmer uppercase tracking-widest mt-0.5">
                Team workspace
              </div>
            </div>
            {[
              { section: "Main", items: [{ ic: "⌂", label: "Home" }, { ic: "⛓", label: "Work Links", badge: "31", on: true }, { ic: "◫", label: "My Leads" }] },
              { section: "Outreach", items: [{ ic: "💬", label: "Responses" }, { ic: "✦", label: "Earn & Refer" }] },
              { section: "Account", items: [{ ic: "⚙", label: "Settings" }] },
            ].map((grp) => (
              <div key={grp.section} className="px-3 mb-1">
                <div className="text-[0.55rem] font-bold uppercase tracking-widest text-white/20 px-2 py-2">
                  {grp.section}
                </div>
                {grp.items.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[0.78rem] mb-0.5 ${
                      item.on ? "bg-indigo/14 text-white" : "text-white/42"
                    }`}
                  >
                    <span className="w-[18px] text-center">{item.ic}</span>
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-indigo/25 text-indigo2 text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-auto px-[18px] pt-3.5 border-t border-white/[0.05] flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center text-[0.7rem] font-extrabold">
                D
              </div>
              <div>
                <div className="text-[0.75rem] text-white/60">Dania K.</div>
                <div className="text-[0.6rem] text-dimmer">Outreach Member</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <div className="font-bricolage font-extrabold text-[1.15rem] tracking-tight">
                  ⛓ Work Links
                </div>
                <div className="text-[0.72rem] text-dimmer mt-0.5">
                  Claim a profile, run outreach, mark used when done
                </div>
              </div>
              <div className="flex gap-2">
                <div className="px-3.5 py-1.5 rounded-lg text-[0.72rem] font-bold border border-white/10 text-white/60 bg-white/[0.04]">
                  Export
                </div>
                <div className="px-3.5 py-1.5 rounded-lg text-[0.72rem] font-bold bg-gradient-to-br from-indigo to-indigo2 text-white">
                  + Add lead
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
              {[
                { v: "31", l: "Pool" },
                { v: "4", l: "My active" },
                { v: "22", l: "I used" },
                { v: "9", l: "My leads" },
              ].map((s) => (
                <div key={s.l} className="bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-3.5 text-center">
                  <div className="font-bricolage font-extrabold text-xl bg-gradient-to-br from-indigo2 to-cyan bg-clip-text text-transparent">
                    {s.v}
                  </div>
                  <div className="text-[0.58rem] text-dimmer uppercase tracking-wide mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-1 mb-3.5 border-b border-white/[0.06]">
              {["📥 Available (31)", "🎯 My active (4)", "✅ Used (22)"].map((t, i) => (
                <div
                  key={t}
                  className={`px-3.5 py-1.5 text-[0.72rem] font-semibold border-b-2 -mb-px ${
                    i === 0 ? "text-white border-indigo2" : "text-dimmer border-transparent"
                  }`}
                >
                  {t}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {[
                { cat: "💼", url: "linkedin.com/in/james-morrison-vp-growth", badge: "Available", badgeCls: "bg-green-500/12 text-green-400", btn: "🎯 Claim", opacity: 1 },
                { cat: "🎯", url: "linkedin.com/sales/lead/ACwAAABq3RsB7N...", badge: "Claimed", badgeCls: "bg-amber-500/12 text-amber-400", btn: "✅ Mark used", opacity: 1 },
                { cat: "💼", url: "linkedin.com/in/sarah-chen-head-of-sales", badge: "Available", badgeCls: "bg-green-500/12 text-green-400", btn: "🎯 Claim", opacity: 1 },
                { cat: "💼", url: "linkedin.com/in/robert-klein-cto-fintech", badge: "Used", badgeCls: "bg-white/[0.06] text-dimmer", btn: "📋 View lead", opacity: 0.5 },
              ].map((row) => (
                <div
                  key={row.url}
                  className="bg-white/[0.025] border border-white/[0.06] rounded-[10px] px-3.5 py-3 flex items-center gap-3 text-[0.75rem]"
                  style={{ opacity: row.opacity }}
                >
                  <span className="opacity-50">{row.cat}</span>
                  <span className="flex-1 text-cyan2 truncate opacity-80">{row.url}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold flex-shrink-0 ${row.badgeCls}`}>
                    {row.badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-[7px] text-[0.65rem] font-bold bg-indigo/15 border border-indigo/25 text-indigo2 flex-shrink-0">
                    {row.btn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
