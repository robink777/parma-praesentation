import type { Config } from "tailwindcss";

// Parma CI (Markenhandbuch Ausgabe 01 · MMXXVI) — Farb-, Typo- und Spacing-Tokens.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        walnuss: "#503F3D",
        messing: "#CB8E49",
        stein: "#F2F1ED",
        reinweiss: "#FCFCFB",
        anthrazit: "#2A2624",
        asche: "#A9A29A",
        sand: "#E1D6C1",
        tinte: "#1B1413",
      },
      fontFamily: {
        slab: ["var(--font-roboto-slab)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      spacing: {
        xs: "8px",
        sm: "16px",
        md: "24px",
        lg: "40px",
        xl: "64px",
        "2xl": "104px",
      },
      maxWidth: {
        content: "1280px",
      },
      letterSpacing: {
        label: "0.16em",
        h1: "-0.035em",
        h2: "-0.025em",
        h3: "-0.01em",
      },
    },
  },
  plugins: [],
};

export default config;
