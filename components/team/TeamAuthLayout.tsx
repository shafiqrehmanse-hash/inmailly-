import { ReactNode } from "react";

export default function TeamAuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ws-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ws-ind to-ws-cyan flex items-center justify-center font-bricolage font-extrabold text-sm text-white">
              I
            </div>
            <span className="font-bricolage font-extrabold text-lg text-white">InMailly</span>
          </div>
          <h1 className="font-bricolage font-extrabold text-2xl text-white">{title}</h1>
          {subtitle && <p className="text-sm text-white/40 mt-2">{subtitle}</p>}
        </div>
        <div className="bg-ws-card border border-ws-border rounded-2xl p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
