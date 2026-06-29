"use client";

export default function LuxBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-lux-bg pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(37,99,235,0.18), transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(34,211,238,0.12), transparent 45%),
            radial-gradient(ellipse 50% 60% at 70% 80%, rgba(139,92,246,0.08), transparent 50%)
          `,
        }}
      />
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] bg-lux-blue/15 animate-[pulse_18s_ease-in-out_infinite]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
