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
        bg: "#04050f",
        bg2: "#07091a",
        card: "#0b0e22",
        card2: "#0f1334",
        indigo: "#4f46e5",
        indigo2: "#6366f1",
        cyan: "#06b6d4",
        cyan2: "#22d3ee",
        dim: "rgba(255,255,255,0.45)",
        dimmer: "rgba(255,255,255,0.22)",
        border: "rgba(79,70,229,0.16)",
      },
      fontFamily: {
        bricolage: ["var(--font-bricolage)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.7)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 2.4s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease forwards",
      },
    },
  },
  plugins: [],
};
export default config;
