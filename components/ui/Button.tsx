import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "lux" | "lux-ghost" | "lux-success" | "lux-cyan" | "lux-soft";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const isLux = variant.startsWith("lux");

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
          variant === "primary" && "btn-primary",
          variant === "ghost" && "btn-ghost",
          variant === "lux" && "lux-btn-primary lux-btn-glow rounded-xl uppercase tracking-wider",
          variant === "lux-ghost" && "lux-btn-ghost rounded-xl uppercase tracking-wider",
          variant === "lux-success" && "lux-btn-success rounded-xl",
          variant === "lux-cyan" && "lux-btn-cyan rounded-xl",
          variant === "lux-soft" && "lux-btn-soft rounded-xl",
          size === "sm" && (isLux ? "px-3.5 py-2 text-[0.72rem] normal-case tracking-normal" : "px-3 py-1.5 text-xs"),
          size === "md" && "px-4 py-2.5 text-sm",
          size === "lg" && "px-6 py-3.5 text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
