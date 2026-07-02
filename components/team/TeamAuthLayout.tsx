import { ReactNode } from "react";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";

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
    <div className="min-h-screen bg-lux-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <InMaillyBrand size="md" />
          </div>
          <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">{title}</h1>
          {subtitle && <p className="text-sm text-lux-muted mt-2">{subtitle}</p>}
        </div>
        <div className="lux-card rounded-2xl p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
