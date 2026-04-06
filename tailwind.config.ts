import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sirius: {
          bg: "#0a0a0f",
          surface: "#12121a",
          surfaceElevated: "#1a1a24",
          border: "#2a2a3a",
          text: "#f0f0f5",
          textMuted: "#8888a0",
          accent: "#00d4ff",
          accentGlow: "#00d4ff40",
          star: "#ffffff",
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
      boxShadow: {
        glow: "0 0 20px #00d4ff40",
        glowSm: "0 0 10px #00d4ff20",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px #00d4ff40" },
          "50%": { boxShadow: "0 0 40px #00d4ff60" },
        },
      },
    },
  },
  plugins: [],
};
export default config;