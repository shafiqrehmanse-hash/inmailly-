"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type LuxSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type LuxSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: LuxSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

export default function LuxSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  disabled = false,
  size = "md",
}: LuxSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    if (!open) setHighlight(-1);
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && highlight >= 0) {
        const opt = options[highlight];
        if (opt && !opt.disabled) pick(opt.value);
      } else {
        setOpen((v) => !v);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((i) => {
        let n = i + 1;
        while (n < options.length && options[n]?.disabled) n++;
        return n >= options.length ? i : n;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((i) => {
        let n = i <= 0 ? options.length - 1 : i - 1;
        while (n >= 0 && options[n]?.disabled) n--;
        return n < 0 ? i : n;
      });
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          "lux-input w-full flex items-center justify-between gap-2 text-left transition-all duration-200",
          size === "sm" ? "text-sm py-2 px-3" : "py-2.5 px-3",
          open && "border-lux-cyan/50 ring-1 ring-lux-cyan/25",
          !selected && "text-lux-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate">{label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-lux-muted text-[0.65rem]"
          aria-hidden
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 mt-1.5 w-full max-h-60 overflow-auto rounded-xl border border-white/[0.1] bg-lux-bg2/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] py-1"
          >
            {options.map((opt, i) => {
              const active = opt.value === value;
              const hot = i === highlight;
              return (
                <li key={opt.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => !opt.disabled && pick(opt.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      active && "text-lux-cyan bg-lux-cyan/10",
                      hot && !active && "bg-white/[0.05] text-lux-text",
                      !active && !hot && "text-lux-muted hover:text-lux-text hover:bg-white/[0.04]",
                      opt.disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
