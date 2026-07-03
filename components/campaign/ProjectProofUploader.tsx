"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProofLightbox, { ProofThumb } from "@/components/proof/ProofLightbox";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ProofRow = {
  id: string;
  display_url: string | null;
  original_url: string | null;
  visible_to_client: boolean;
  created_at: string;
};

type QueueItem = {
  id: string;
  file: File;
  preview: string;
};

export default function ProjectProofUploader({ projectId }: { projectId: string }) {
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaign/proofs?projectId=${projectId}`);
    const data = await res.json();
    setProofs(data.proofs || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      setMsg({ text: "No image files found.", type: "error" });
      return;
    }
    const items: QueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setQueue((q) => [...q, ...items]);
    setMsg({ text: `${files.length} screenshot${files.length > 1 ? "s" : ""} ready — click Upload`, type: "success" });
  }

  async function uploadQueue() {
    if (!queue.length) return;
    setUploading(true);
    setMsg(null);
    const form = new FormData();
    form.append("projectId", projectId);
    queue.forEach((item) => form.append("files", item.file, item.file.name || "screenshot.png"));

    const res = await fetch("/api/campaign/proofs", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);

    queue.forEach((item) => URL.revokeObjectURL(item.preview));
    setQueue([]);

    if (!res.ok) {
      setMsg({ text: data.error || "Upload failed", type: "error" });
      return;
    }

    const errNote = data.errors?.length ? ` (${data.errors.length} skipped)` : "";
    setMsg({
      text: `${data.count} proof${data.count !== 1 ? "s" : ""} uploaded — client sees cropped HD version${errNote}`,
      type: "success",
    });
    load();
  }

  function clearQueue() {
    queue.forEach((item) => URL.revokeObjectURL(item.preview));
    setQueue([]);
  }

  async function toggleVisible(id: string, visible: boolean) {
    await fetch("/api/campaign/proofs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, visible_to_client: visible }),
    });
    load();
  }

  async function removeProof(id: string) {
    if (!confirm("Remove this screenshot permanently? It will disappear from the client dashboard.")) return;
    await fetch(`/api/campaign/proofs?id=${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (!zoneRef.current?.contains(document.activeElement) && document.activeElement !== document.body) {
        // still allow paste when focused anywhere in uploader section
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      Array.from(items).forEach((item) => {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      });
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="lux-card p-5 sm:p-6 border-lux-violet/20">
        <p className="text-[0.65rem] uppercase tracking-widest text-lux-violet font-semibold mb-1">
          Proof of sending
        </p>
        <h2 className="font-bricolage font-extrabold text-lg text-lux-text mb-2">
          InMail screenshot proofs
        </h2>
        <p className="text-sm text-lux-muted leading-relaxed max-w-2xl">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-lux-text text-xs">Print Screen</kbd>{" "}
          then <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-lux-text text-xs">Ctrl+V</kbd> here — or
          drop / select multiple files. We keep your full capture and auto-crop an HD version for the client portal.
        </p>
      </div>

      {msg && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-medium",
            msg.type === "success"
              ? "bg-lux-violet/10 text-lux-violet border border-lux-violet/25"
              : "bg-red-500/10 text-red-400 border border-red-500/25"
          )}
        >
          {msg.text}
        </div>
      )}

      <div
        ref={zoneRef}
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "lux-card p-6 border-2 border-dashed transition-colors outline-none focus:border-lux-violet/50",
          dragOver ? "border-lux-violet bg-lux-violet/5" : "border-white/[0.1]"
        )}
      >
        <div className="text-center space-y-3">
          <div className="text-3xl opacity-50">📸</div>
          <p className="font-bricolage font-bold text-lux-text">Paste or drop screenshots</p>
          <p className="text-xs text-lux-muted">
            Ctrl+V after Print Screen · bulk paste supported · PNG / JPG
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="lux-btn-primary text-sm px-4 py-2"
            >
              Choose files
            </button>
            {queue.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={uploadQueue}
                  disabled={uploading}
                  className="lux-btn-primary text-sm px-4 py-2 bg-lux-violet hover:opacity-90"
                >
                  {uploading ? "Uploading…" : `Upload ${queue.length}`}
                </button>
                <button type="button" onClick={clearQueue} className="lux-btn-ghost text-sm px-4 py-2">
                  Clear queue
                </button>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {queue.length > 0 && (
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {queue.map((item) => (
              <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden border border-white/[0.1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bricolage font-bold text-lux-text">
            Uploaded proofs ({proofs.filter((p) => p.visible_to_client).length} on client · {proofs.length}{" "}
            total)
          </h3>
          <span className="text-xs text-lux-muted">Uncheck Client to hide · Delete removes file</span>
        </div>

        {loading ? (
          <p className="text-sm text-lux-muted">Loading…</p>
        ) : proofs.length === 0 ? (
          <div className="lux-card p-8 text-center text-sm text-lux-muted">
            No proofs yet — paste your first Print Screen capture above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {proofs.map((p) => (
              <div key={p.id} className={cn("lux-card p-3 space-y-2", !p.visible_to_client && "opacity-75 border-red-500/20")}>
                {p.display_url ? (
                  <ProofThumb
                    src={p.display_url}
                    alt="InMail proof"
                    onClick={() => setLightbox(p.display_url)}
                    className="w-full"
                    size="md"
                  />
                ) : (
                  <div className="aspect-[4/3] rounded-xl bg-white/[0.03] flex items-center justify-center text-xs text-lux-muted">
                    Processing…
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 text-[0.65rem]">
                  <span className="text-lux-muted">{formatDate(p.created_at)}</span>
                  <label className="flex items-center gap-1.5 text-lux-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.visible_to_client}
                      onChange={(e) => toggleVisible(p.id, e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Client visible
                  </label>
                </div>
                <div className="flex gap-2">
                  {p.original_url && (
                    <button
                      type="button"
                      className="text-[0.65rem] text-lux-cyan hover:underline"
                      onClick={() => setLightbox(p.original_url!)}
                    >
                      Full capture
                    </button>
                  )}
                  {!p.visible_to_client && (
                    <button
                      type="button"
                      className="text-[0.65rem] text-amber-400/90 hover:text-amber-400"
                      onClick={() => toggleVisible(p.id, true)}
                    >
                      Show to client
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-[0.65rem] text-red-400/80 hover:text-red-400 ml-auto"
                    onClick={() => removeProof(p.id)}
                  >
                    Remove screenshot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && <ProofLightbox src={lightbox} alt="Proof screenshot" onClose={() => setLightbox(null)} />}
    </div>
  );
}
