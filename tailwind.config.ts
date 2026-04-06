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
        space: {
          black: "#000000",
          spectral: "#f0f0fa",
          ghost: "rgba(240, 240, 250, 0.1)",
          "ghost-border": "rgba(240, 240, 250, 0.35)",
          overlay: "rgba(0, 0, 0, 0.5)",
        },
      },
      fontFamily: {
        display: ["D-DIN-Bold", "D-DIN", "Arial", "Verdana", "sans-serif"],
        body: ["D-DIN", "Arial", "Verdana", "sans-serif"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.00", letterSpacing: "0.96px" }],
        hero: ["3rem", { lineHeight: "1.00", letterSpacing: "0.96px" }],
        nav: ["0.81rem", { lineHeight: "0.94", letterSpacing: "1.17px" }],
        navsmall: ["0.75rem", { lineHeight: "2.00", letterSpacing: "normal" }],
        caption: ["0.81rem", { lineHeight: "0.94", letterSpacing: "1.17px" }],
        micro: ["0.63rem", { lineHeight: "0.94", letterSpacing: "1px" }],
        body: ["1rem", { lineHeight: "1.50", letterSpacing: "normal" }],
      },
      borderRadius: {
        ghost: "32px",
        sharp: "4px",
      },
    },
  },
  plugins: [],
};
export default config;