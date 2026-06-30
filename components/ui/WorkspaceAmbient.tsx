"use client";

/** Subtle ambient gradients for dark workspaces — lighter than marketing LuxBackground */
export default function WorkspaceAmbient() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-lux-bg pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 45% at 15% 15%, rgba(37,99,235,0.14), transparent 52%),
            radial-gradient(ellipse 55% 40% at 85% 8%, rgba(34,211,238,0.1), transparent 48%),
            radial-gradient(ellipse 45% 50% at 75% 85%, rgba(139,92,246,0.07), transparent 50%)
          `,
        }}
      />
      <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full blur-[140px] bg-lux-cyan/[0.07] animate-[pulse_22s_ease-in-out_infinite] motion-reduce:animate-none" />
      <div
        className="absolute inset-0 opacity-[0.025] lux-noise"
        style={{ mixBlendMode: "overlay" }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
    </div>
  );
}
