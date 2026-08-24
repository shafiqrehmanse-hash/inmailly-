"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ClientCampaignProfileCard, {
  type CampaignProfileCardData,
} from "@/components/client/ClientCampaignProfileCard";
import { cn } from "@/lib/utils";

const MAX_DATA_URL_CHARS = 5_500_000;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

async function normalizeScreenshot(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1400;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process screenshot"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.88;
      let out = canvas.toDataURL("image/jpeg", quality);
      while (out.length > MAX_DATA_URL_CHARS && quality > 0.45) {
        quality -= 0.1;
        out = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error("Invalid screenshot"));
    img.src = dataUrl;
  });
}

export default function CampaignProjectProfilesPanel({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [profiles, setProfiles] = useState<CampaignProfileCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [lastAdded, setLastAdded] = useState<CampaignProfileCardData | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/campaign/campaign-profiles?projectId=${projectId}`);
    const data = await res.json();
    if (res.ok) setProfiles(data.profiles || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function acceptAndAdd(file: File | null) {
    if (!file?.type.startsWith("image/")) {
      setError("Paste or upload a LinkedIn profile screenshot (PNG/JPG).");
      return;
    }
    setError("");
    setLastAdded(null);
    setUploading(true);
    try {
      const raw = await fileToDataUrl(file);
      const imageDataUrl = await normalizeScreenshot(raw);
      const res = await fetch("/api/campaign/campaign-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, imageDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add profile");
        setUploading(false);
        return;
      }
      setLastAdded(data.profile);
      load();
    } catch {
      setError("Could not process that screenshot.");
    }
    setUploading(false);
  }

  async function removeProfile(profileId: string) {
    const res = await fetch(
      `/api/campaign/campaign-profiles?profileId=${profileId}&projectId=${projectId}`,
      { method: "DELETE" }
    );
    if (res.ok) load();
  }

  return (
    <div className="lux-card p-5 sm:p-6 space-y-5 border-lux-violet/20">
      <div>
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-lux-violet font-semibold mb-1">
          Sender profiles for client portal
        </p>
        <h2 className="font-bricolage font-bold text-xl text-lux-text">LinkedIn accounts in use</h2>
        <p className="text-sm text-lux-muted mt-2 leading-relaxed">
          Paste a LinkedIn profile screenshot for each sender account on{" "}
          <strong className="text-lux-text">{projectName}</strong>. Clients see compressed cards with headline,
          title, and photos in their portal under <strong className="text-lux-text">Sender profiles</strong>.
        </p>
      </div>

      <div
        ref={dropRef}
        tabIndex={0}
        onPaste={(e) => {
          const file = e.clipboardData.files[0];
          if (file) {
            e.preventDefault();
            acceptAndAdd(file);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          acceptAndAdd(e.dataTransfer.files[0] || null);
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 text-center transition-colors outline-none focus:border-lux-violet/50",
          dragOver ? "border-lux-violet bg-lux-violet/10" : "border-white/10 bg-black/20",
          uploading && "opacity-60 pointer-events-none"
        )}
      >
        <p className="text-sm text-lux-muted">
          Open LinkedIn profile → Print Screen → <strong className="text-lux-text">Ctrl+V</strong> here
        </p>
        <button
          type="button"
          className="text-xs text-lux-cyan hover:underline mt-2"
          onClick={() => fileInputRef.current?.click()}
        >
          or upload image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => acceptAndAdd(e.target.files?.[0] || null)}
        />
        {uploading && <p className="text-xs text-lux-cyan mt-3">Extracting profile photo, cover, headline…</p>}
      </div>

      {error && <p className="text-sm text-red-400 font-semibold">{error}</p>}

      {lastAdded && (
        <div className="border border-emerald-500/25 bg-emerald-500/5 rounded-xl p-4 space-y-3">
          <p className="text-[0.65rem] uppercase tracking-wider text-emerald-400 font-bold">Added — visible to client</p>
          <ClientCampaignProfileCard profile={lastAdded} compact />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-lux-muted">Loading profiles…</p>
      ) : profiles.length > 0 ? (
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <p className="text-[0.65rem] uppercase tracking-wider text-lux-muted font-bold">
            {profiles.length} profile{profiles.length === 1 ? "" : "s"} on this campaign
          </p>
          <div className="flex flex-wrap gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="relative group">
                <ClientCampaignProfileCard profile={p} compact />
                <button
                  type="button"
                  className="absolute top-2 right-2 text-[0.6rem] bg-red-500/90 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeProfile(p.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-lux-muted">No sender profiles yet — paste the first LinkedIn screenshot above.</p>
      )}
    </div>
  );
}
