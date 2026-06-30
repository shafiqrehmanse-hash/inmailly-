"use client";

import LuxSelect from "@/components/ui/LuxSelect";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

export default function PageSizeSelect({
  value,
  onChange,
  className = "w-36",
}: {
  value: number;
  onChange: (size: number) => void;
  className?: string;
}) {
  return (
    <LuxSelect
      className={className}
      size="sm"
      value={String(value)}
      onChange={(v) => onChange(parseInt(v, 10))}
      options={PAGE_SIZE_OPTIONS.map((n) => ({
        value: String(n),
        label: `${n} per page`,
      }))}
    />
  );
}
