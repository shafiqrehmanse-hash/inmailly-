"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
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

type Extracted = CampaignProfileCardData & {
  profile_photo_data: string;
  cover_photo_data: string;
  card_preview_data: string;
};

export default function AdminClientCampaignProfilesPanel({
  projectId,
  clientId,
  adminKey,
  onToast,
}: {
  projectId?: string | null;
  clientId?: string | null;
  adminKey?: string;
  onToast?: (msg: string, type?: "success" | "error") => void;
}) {
  const [profiles, setProfiles] = useState<CampaignProfileCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<Extracted | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!projectId || !adminKey) return;
    setLoading(true);
    const res = await fetch(
      `/api/admin/clients/campaign-profiles?key=${adminKey}&projectId=${projectId}`
    );
    const data = await res.json();
    setProfiles(data.profiles || []);
    setLoading(false);
  }, [adminKey, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function acceptImage(file: File | null) {
    if (!file?.type.startsWith("image/")) {
      setError("Paste or upload a LinkedIn profile screenshot (PNG/JPG).");
      return;
    }
    setError("");
    setPreview(null);
    try {
      const raw = await fileToDataUrl(file);
      const normalized = await normalizeScreenshot(raw);
      setImageDataUrl(normalized);
    } catch {
      setError("Could not read that image.");
    }
  }

  async function extractProfile() {
    if (!adminKey || !imageDataUrl) return;
    setExtracting(true);
    setError("");
    const res = await fetch(`/api/admin/clients/campaign-profiles/extract?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ imageDataUrl }),
    });
    const data = await res.json();
    setExtracting(false);
    if (!res.ok) {
      setError(data.error || "Extraction failed");
      onToast?.(data.error || "Extraction failed", "error");
      return;
    }
    setPreview({ id: "preview", ...data.extracted });
  }

  async function saveProfile() {
    if (!adminKey || !projectId || !clientId || !preview) return;
    setSaving(true);
    const res = await fetch(`/api/admin/clients/campaign-profiles?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        projectId,
        clientId,
        display_name: preview.display_name,
        headline: preview.headline,
        title: preview.title,
        linkedin_url: preview.linkedin_url,
        profile_photo_data: preview.profile_photo_data,
        cover_photo_data: preview.cover_photo_data,
        card_preview_data: preview.card_preview_data,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      onToast?.(data.error || "Save failed", "error");
      return;
    }
    onToast?.(`Added ${preview.display_name} to campaign profiles`);
    setPreview(null);
    setImageDataUrl(null);
    load();
  }

  async function removeProfile(profileId: string) {
    if (!adminKey || !projectId) return;
    const res = await fetch(
      `/api/admin/clients/campaign-profiles?key=${adminKey}&profileId=${profileId}&projectId=${projectId}`,
      { method: "DELETE", headers: { "x-admin-key": adminKey } }
    );
    if (!res.ok) {
      const data = await res.json();
      onToast?.(data.error || "Delete failed", "error");
      return;
    }
    onToast?.("Profile removed");
    load();
  }

  if (!projectId || !clientId) return null;

  return (
    <div className="mt-3 border border-violet-500/25 bg-violet-500/5 px-3 py-3 rounded-lg space-y-4">
      <div>
        <p className="text-[0.65rem] uppercase tracking-wider text-violet-300 font-bold">
          Campaign sender profiles
        </p>
        <p className="text-xs text-lux-muted mt-1 leading-relaxed">
          Paste a LinkedIn profile screenshot — we extract name, headline, title, profile photo, and cover.
          Client sees compressed cards in their portal under Sender profiles.{" "}
          <span className="text-lux-cyan/90">Tip: include the cover banner + circular avatar + name for best crops.</span>
        </p>
      </div>

      <div
        ref={dropRef}
        tabIndex={0}
        onPaste={(e) => {
          const file = e.clipboardData.files[0];
          if (file) {
            e.preventDefault();
            acceptImage(file);
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
          acceptImage(e.dataTransfer.files[0] || null);
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center transition-colors outline-none focus:border-violet-400/50",
          dragOver ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-black/20"
        )}
      >
        {imageDataUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Pasted profile screenshot"
              className="max-h-40 mx-auto rounded-lg border border-white/10"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="lux" size="sm" disabled={extracting} onClick={extractProfile}>
                {extracting ? "Extracting…" : "Extract profile →"}
              </Button>
              <Button
                variant="lux-ghost"
                size="sm"
                onClick={() => {
                  setImageDataUrl(null);
                  setPreview(null);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-lux-muted">
              Print Screen on LinkedIn profile → <strong className="text-lux-text">Ctrl+V</strong> here
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
              onChange={(e) => acceptImage(e.target.files?.[0] || null)}
            />
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

      {preview && (
        <div className="space-y-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-wider text-emerald-400 font-bold">
            Preview — client will see this
          </p>
          <ClientCampaignProfileCard profile={preview} />
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-lux-muted">Name:</span> {preview.display_name}
            </div>
            <div>
              <span className="text-lux-muted">Headline:</span> {preview.headline || "—"}
            </div>
            <div className="sm:col-span-2">
              <span className="text-lux-muted">Title:</span> {preview.title || "—"}
            </div>
          </div>
          <Button variant="lux-cyan" size="sm" disabled={saving} onClick={saveProfile}>
            {saving ? "Saving…" : "Add to client campaign →"}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-lux-muted">Loading profiles…</p>
      ) : profiles.length > 0 ? (
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <p className="text-[0.65rem] uppercase tracking-wider text-lux-muted font-bold">
            {profiles.length} profile{profiles.length === 1 ? "" : "s"} on campaign
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
        <p className="text-xs text-lux-muted">No sender profiles yet for this client.</p>
      )}
    </div>
  );
}
