import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#07120a",
          2: "#0d1f12",
          3: "#132b19",
          panel: "#0f1e14",
        },
        border: {
          DEFAULT: "#1a3320",
          bright: "#2a5534",
        },
        green: {
          dim: "#1e4a28",
          mid: "#2d7a3a",
          DEFAULT: "#3dba55",
          bright: "#5de878",
          glow: "rgba(61,186,85,0.25)",
          pulse: "rgba(93,232,120,0.12)",
        },
        amber: "#f59e0b",
        danger: "#ef4444",
        "danger-dim": "#7f1d1d",
        ink: {
          DEFAULT: "#e8f5eb",
          muted: "#6b9e77",
          faint: "#3a5e43",
        },
      },
      fontFamily: {
        mono:    ["Nunito", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Nunito", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        body:    ["Nunito", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        "flash-correct": {
          "0%": { backgroundColor: "rgba(61,186,85,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-wrong": {
          "0%": { backgroundColor: "rgba(239,68,68,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        "timer-shrink": {
          "0%": { transform: "scaleX(1)" },
          "100%": { transform: "scaleX(0)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "70%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "streak-burst": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 16px rgba(61,186,85,0.2)" },
          "50%": { boxShadow: "0 0 36px rgba(61,186,85,0.5)" },
        },
      },
      animation: {
        "flash-correct": "flash-correct 0.35s ease-out",
        "flash-wrong": "flash-wrong 0.35s ease-out",
        "pop-in": "pop-in 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        "slide-up": "slide-up 0.2s ease-out",
        "streak-burst": "streak-burst 0.3s ease-out",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;