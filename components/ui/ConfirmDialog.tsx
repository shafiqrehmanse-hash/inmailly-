"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title}>
      <div className="space-y-5">
        <div className="text-sm text-lux-muted leading-relaxed">{description}</div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="lux-ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant="lux"
            className={destructive ? "bg-red-600 hover:bg-red-500 border-red-500/50" : undefined}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
