"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
    </svg>
  );
}

export default function PasswordInput({
  value,
  onChange,
  className,
  inputClassName = "ws-input",
  required,
  placeholder,
  id,
  variant = "ws",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
  variant?: "ws" | "lux";
}) {
  const [visible, setVisible] = useState(false);
  const iconClass = variant === "lux" ? "text-lux-muted hover:text-lux-text" : "text-white/40 hover:text-white/70";

  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        placeholder={placeholder}
        className={cn(inputClassName, "pr-11")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={required ? "current-password" : "new-password"}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className={cn("absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors", iconClass)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
