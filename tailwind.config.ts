import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        off: "#f7f8fc",
        off2: "#f0f2f8",
        ink: "#0f0f1a",
        ink2: "#1e1f2e",
        mid: "#4b5268",
        dim: "#8892a4",
        dimmer: "#b0b8c8",
        line: "#e4e7ef",
        line2: "#d0d5e4",
        ind: "#4338ca",
        ind2: "#6366f1",
        "ind-light": "#eef0ff",
        sky: "#0ea5e9",
        "sky-light": "#e0f2fe",
        green: "#059669",
        "green-l": "#d1fae5",
        red: "#dc2626",
        amber: "#d97706",
        // aliases
        bg: "#f7f8fc",
        bg2: "#f0f2f8",
        card: "#ffffff",
        card2: "#f7f8fc",
        indigo: "#4338ca",
        indigo2: "#6366f1",
        cyan: "#0ea5e9",
        cyan2: "#0ea5e9",
        border: "#e4e7ef",
        // workspace (team + admin) — CURSOR_FINAL
        "ws-bg": "#07091a",
        "ws-card": "#0b0e22",
        "ws-card2": "#0f1334",
        "ws-border": "rgba(79,70,229,0.16)",
        "ws-ind": "#6366f1",
        "ws-cyan": "#22d3ee",
        // luxury landing
        lux: {
          bg: "#05070B",
          bg2: "#0C1018",
          card: "#131A24",
          text: "#FFFFFF",
          muted: "#9DA8B8",
          blue: "#2563EB",
          cyan: "#22D3EE",
          violet: "#7C6AEF",
        },
      },
      fontFamily: {
        bricolage: ["var(--font-bricolage)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(15,15,26,.08), 0 16px 48px rgba(15,15,26,.1)",
        card2: "0 4px 24px rgba(67,56,202,.12), 0 1px 4px rgba(67,56,202,.08)",
        sm: "0 1px 3px rgba(15,15,26,.06), 0 4px 16px rgba(15,15,26,.06)",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.65)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        pulse: "pulse 2.2s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease forwards",
        "slide-down": "slide-down 0.35s ease forwards",
        scroll: "scroll 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
