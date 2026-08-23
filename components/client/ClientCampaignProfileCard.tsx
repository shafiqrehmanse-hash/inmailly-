"use client";

import { cn } from "@/lib/utils";

export type CampaignProfileCardData = {
  id: string;
  display_name: string;
  headline?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  profile_photo_data?: string | null;
  cover_photo_data?: string | null;
  card_preview_data?: string | null;
};

export default function ClientCampaignProfileCard({
  profile,
  compact = false,
  className = "",
}: {
  profile: CampaignProfileCardData;
  compact?: boolean;
  className?: string;
}) {
  const headline = profile.headline || profile.title || "";
  const title = profile.title && profile.title !== profile.headline ? profile.title : null;

  if (profile.card_preview_data && compact) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-white/[0.08] bg-lux-card/80 shadow-lg",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.card_preview_data}
          alt={`${profile.display_name} campaign profile`}
          className="w-full h-auto block"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0e22] shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        compact ? "max-w-[280px]" : "max-w-[360px]",
        className
      )}
    >
      <div className="relative h-[72px] sm:h-[80px] bg-gradient-to-r from-lux-blue/30 to-lux-violet/30">
        {profile.cover_photo_data && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.cover_photo_data}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
      <div className="relative px-4 pb-4 pt-0">
        <div className="flex gap-3 -mt-7 sm:-mt-8">
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-[#0b0e22] overflow-hidden bg-lux-bg2">
            {profile.profile_photo_data ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.profile_photo_data}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lux-muted text-lg font-bold">
                {profile.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="pt-8 sm:pt-9 min-w-0 flex-1">
            <p className="font-bricolage font-bold text-lux-text text-sm sm:text-base truncate">
              {profile.display_name}
            </p>
            {headline && (
              <p className="text-[0.7rem] sm:text-xs text-lux-muted mt-0.5 line-clamp-2 leading-snug">
                {headline}
              </p>
            )}
            {title && (
              <p className="text-[0.65rem] text-lux-cyan/80 mt-1 line-clamp-1">{title}</p>
            )}
          </div>
        </div>
        {profile.linkedin_url && (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[0.65rem] text-lux-cyan hover:underline truncate max-w-full"
          >
            View on LinkedIn →
          </a>
        )}
      </div>
    </div>
  );
}
