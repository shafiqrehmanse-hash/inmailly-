"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type MenuPos = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
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
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => setMounted(true), []);

  function updateMenuPos() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 6;
    const preferredHeight = Math.min(240, options.length * 40 + 12);
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

    if (openUp) {
      setMenuPos({
        bottom: window.innerHeight - rect.top + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(preferredHeight, spaceAbove),
      });
    } else {
      setMenuPos({
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(preferredHeight, spaceBelow),
      });
    }
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    const onScroll = () => setOpen(false);
    const onResize = () => updateMenuPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest?.("[data-lux-select-menu]")) setOpen(false);
      }
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

  const menu =
    open && menuPos && mounted
      ? createPortal(
          <AnimatePresence>
            <motion.ul
              id={listId}
              data-lux-select-menu
              role="listbox"
              initial={{ opacity: 0, y: menuPos.top != null ? -4 : 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: menuPos.top != null ? -4 : 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed",
                top: menuPos.top,
                bottom: menuPos.bottom,
                left: menuPos.left,
                width: menuPos.width,
                maxHeight: menuPos.maxHeight,
                zIndex: 9999,
              }}
              className="overflow-auto rounded-xl border border-white/[0.12] bg-lux-bg2 shadow-[0_20px_60px_rgba(0,0,0,0.55)] py-1 backdrop-blur-xl"
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
                        "w-full text-left px-3 py-2.5 text-sm transition-colors",
                        active && "text-lux-cyan bg-lux-cyan/10",
                        hot && !active && "bg-white/[0.06] text-lux-text",
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
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
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
      {menu}
    </div>
  );
}
