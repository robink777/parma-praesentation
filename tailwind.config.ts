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
      // "Body" (16/26) und "Small" (13/20) aus der CI-Typo-Hierarchie (Markenhandbuch Abschnitt
      // 4) — bislang NICHT als Tailwind-Theme-Werte definiert, obwohl `text-body`/`text-small` an
      // über 120 Stellen im Code verwendet werden. Da Tailwind nur Utilities für bekannte
      // Theme-Keys erzeugt, griffen beide Klassen bisher ins Leere (der Browser fiel auf die
      // geerbte Standardgröße 16px/24px zurück) — gefunden bei der Oktober-2026-"Optik"-Prüfung
      // über getComputedStyle() im Live-Browser. Diese Ergänzung macht `text-small` (und
      // `text-body`, das zufällig schon ungefähr richtig aussah, aber mit falschem Leading) an
      // allen bestehenden Stellen rückwirkend korrekt — ohne dass jede einzelne Stelle angefasst
      // werden muss.
      fontSize: {
        small: ["13px", { lineHeight: "20px" }],
        body: ["16px", { lineHeight: "26px" }],
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
