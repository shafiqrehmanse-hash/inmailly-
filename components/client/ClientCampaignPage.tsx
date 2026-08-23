"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import ClientCampaignProfileCard, {
  type CampaignProfileCardData,
} from "@/components/client/ClientCampaignProfileCard";
import ClientPackageProgress from "@/components/client/ClientPackageProgress";
import { cn } from "@/lib/utils";

type CampaignData = {
  client: { name: string; company_name: string | null };
  project: {
    name: string;
    status: string;
    audience_brief: string | null;
    target_titles: string | null;
    target_industries: string | null;
    target_regions: string | null;
    inmail_package_size: number | null;
    inmail_subject: string | null;
    inmail_script: string | null;
    sales_nav_direct_link: string | null;
    sales_nav_link_count: number | null;
    branding_submitted_at: string | null;
  };
  stats: { total: number; interested: number; sends: number };
  branding: {
    pending: boolean;
    submitted: boolean;
    submitted_at: string | null;
    inmail_subject: string | null;
    sales_nav_link_count: number | null;
    profile_links_parsed: number | null;
    profile_links_imported: number | null;
  };
  contract: { status: string; signed_at: string | null } | null;
  packageProgress: { target: number; completed: number; percent: number } | null;
  profiles: CampaignProfileCardData[];
  isPreview: boolean;
};

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-black/20 border border-white/[0.06] rounded-xl p-4">
      <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted mb-2">{label}</p>
      <div className="text-sm text-lux-text leading-relaxed">{children}</div>
    </div>
  );
}

export default function ClientCampaignPage() {
  const router = useRouter();
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/client/campaign")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/client/login");
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (!d || d.error) {
          setError(d?.error || "Could not load campaign");
          setLoading(false);
          return;
        }
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="text-lux-muted py-12 text-center">Loading campaign details…</div>;
  }

  if (error || !data) {
    return <div className="text-red-400 py-12 text-center">{error || "Campaign unavailable"}</div>;
  }

  const { project, stats, branding, contract, packageProgress, profiles } = data;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-lux-cyan font-semibold mb-1">
          Your campaign
        </p>
        <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">{project.name}</h1>
        <p className="text-sm text-lux-muted mt-2 capitalize">
          Status: <span className="text-lux-text">{project.status}</span>
          {data.isPreview && " · Preview until you go live"}
        </p>
      </div>

      {data.isPreview && (
        <div className="lux-card p-4 border-lux-cyan/25">
          <p className="text-sm text-lux-muted leading-relaxed">
            This is your campaign workspace preview. Book a call with InMailly to activate live outreach — stats,
            profiles, and responses will populate automatically.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Responses", value: stats.total },
          { label: "Interested", value: stats.interested },
          { label: "Send proofs", value: stats.sends },
        ].map((s) => (
          <div key={s.label} className="lux-card-elite p-4 text-center">
            <div className="font-bricolage font-extrabold text-2xl text-lux-text tabular-nums">
              {s.value.toLocaleString()}
            </div>
            <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {packageProgress && (
        <ClientPackageProgress progress={packageProgress} />
      )}

      <section className="space-y-4">
        <h2 className="font-bricolage font-bold text-xl text-lux-text">Audience & targeting</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {project.audience_brief && (
            <InfoBlock label="Audience brief">
              <p className="whitespace-pre-wrap">{project.audience_brief}</p>
            </InfoBlock>
          )}
          {project.target_titles && (
            <InfoBlock label="Target titles">{project.target_titles}</InfoBlock>
          )}
          {project.target_industries && (
            <InfoBlock label="Industries">{project.target_industries}</InfoBlock>
          )}
          {project.target_regions && (
            <InfoBlock label="Regions">{project.target_regions}</InfoBlock>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bricolage font-bold text-xl text-lux-text">Branding & messaging</h2>
          {branding.pending && (
            <Link href="/client/branding" className="lux-btn-primary text-[0.75rem] py-2 px-4">
              Submit branding →
            </Link>
          )}
        </div>
        {branding.pending && (
          <div className="lux-card p-4 border-amber-500/30 bg-amber-500/5">
            <p className="text-sm text-amber-200/90">
              Action required — submit your InMail subject, script, Sales Nav link, and profile URLs before
              outreach can start.
            </p>
          </div>
        )}
        {branding.submitted && (
          <div className="grid md:grid-cols-2 gap-4">
            {branding.inmail_subject && (
              <InfoBlock label="InMail subject">{branding.inmail_subject}</InfoBlock>
            )}
            {project.inmail_script && (
              <InfoBlock label="InMail script">
                <p className="whitespace-pre-wrap max-h-40 overflow-y-auto">{project.inmail_script}</p>
              </InfoBlock>
            )}
            {project.sales_nav_direct_link && (
              <InfoBlock label="Sales Navigator link">
                <a
                  href={project.sales_nav_direct_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lux-cyan break-all hover:underline"
                >
                  {project.sales_nav_direct_link}
                </a>
              </InfoBlock>
            )}
            {branding.sales_nav_link_count != null && (
              <InfoBlock label="Planned send volume">
                {branding.sales_nav_link_count.toLocaleString()} InMails
              </InfoBlock>
            )}
            {(branding.profile_links_parsed ?? 0) > 0 && (
              <InfoBlock label="Profile URLs you provided">
                {branding.profile_links_parsed?.toLocaleString()} unique URLs
                {(branding.profile_links_imported ?? 0) > 0 && (
                  <span className="text-emerald-400 ml-1">
                    · {branding.profile_links_imported?.toLocaleString()} in outreach pool
                  </span>
                )}
              </InfoBlock>
            )}
            {branding.submitted_at && (
              <InfoBlock label="Submitted">
                {new Date(branding.submitted_at).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </InfoBlock>
            )}
          </div>
        )}
        {!branding.pending && !branding.submitted && (
          <p className="text-sm text-lux-muted">Branding not requested yet for this campaign.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bricolage font-bold text-xl text-lux-text">Sender profiles</h2>
            <p className="text-sm text-lux-muted mt-1">
              LinkedIn identities used when sending InMails on your behalf.
            </p>
          </div>
          {profiles.length > 0 && (
            <Link href="/client/profiles" className="text-sm text-lux-cyan hover:underline font-semibold">
              Full gallery →
            </Link>
          )}
        </div>
        {profiles.length === 0 ? (
          <p className="text-sm text-lux-muted lux-card p-4">
            Your campaign manager will add sender profiles here once accounts are assigned.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {profiles.slice(0, 4).map((p) => (
              <ClientCampaignProfileCard key={p.id} profile={p} compact />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-bricolage font-bold text-xl text-lux-text">Agreement</h2>
        <div
          className={cn(
            "lux-card p-4",
            contract?.status === "signed" && "border-emerald-500/25",
            contract?.status === "pending_signature" && "border-amber-500/25"
          )}
        >
          {!contract && (
            <p className="text-sm text-lux-muted">No service agreement on file yet.</p>
          )}
          {contract?.status === "pending_signature" && (
            <p className="text-sm text-amber-200/90">
              Signature required —{" "}
              <Link href="/client/contract" className="text-lux-cyan hover:underline font-semibold">
                review and sign your agreement →
              </Link>
            </p>
          )}
          {contract?.status === "signed" && (
            <p className="text-sm text-emerald-300/90">
              Agreement signed
              {contract.signed_at
                ? ` on ${new Date(contract.signed_at).toLocaleDateString(undefined, { dateStyle: "medium" })}`
                : ""}
              .{" "}
              <Link href="/client/contract" className="text-lux-cyan hover:underline">
                View contract →
              </Link>
            </p>
          )}
          {contract?.status === "terminated" && (
            <p className="text-sm text-lux-muted">
              Previous agreement terminated.{" "}
              <Link href="/client/contract" className="text-lux-cyan hover:underline">
                View details →
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
