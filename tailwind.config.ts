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
        // Diagramm-Akzentfarben für die TV-Dashboard-Statistikseite im Admin-Bereich (Oktober
        // 2026 Chat-Vorgabe: "mehr Akzentfarben an den Datenpunkten ... jetzt ist es mir viel zu
        // viel Ton in Ton") — eine zweite, enger umrissene CI-Abweichung ZUSÄTZLICH zur bereits
        // dokumentierten Dichte-Ausnahme (siehe Memory feedback_admin_panel_ci_dichte.md): nur für
        // Datenpunkte (KPI-Icons, Diagrammbalken, Status-Hinweise), nicht für Fließtext/Flächen —
        // dort bleibt die CI-Regel "Walnuss nur Text, Messing max. 1× pro Sichtbereich" unverändert
        // bestehen. Acht fest geordnete, NIE rotierende Kategorialfarben nach der dataviz-Skill-
        // Methode (plugin:anthropic-skills im Projektwissen) — Messing bleibt als Marken-Anker
        // Slot 1, die übrigen sieben wurden iterativ mit deren scripts/validate_palette.js geprüft
        // (Lightness-Band, Chroma-Floor ≥0.1, CVD-Abstand, Kontrast), bis alle sechs Prüfungen für
        // Light-Mode bestehen (worst-case ΔE 8.0 deutan / 18.8 normal-vision, beides über der
        // jeweiligen Mindestschwelle). Kein Dark-Mode-Pendant: Die App hat aktuell nirgendwo einen
        // Dark Mode (auch die Basis-CI-Palette oben hat keine Dark-Varianten), ein ungenutzter
        // zweiter Satz wäre totes Gewicht.
        chart: {
          1: "#CB8E49", // Messing (Marken-Anker)
          2: "#1D6FA3", // Stahlblau
          3: "#B6512E", // Terrakotta
          4: "#6A3FA0", // Violett
          5: "#3C7A3E", // Salbeigrün
          6: "#4A5FA0", // Flieder
          7: "#9C2F57", // Beere
          8: "#00897B", // Petrol
        },
        // Reservierte, feste Status-Skala (siehe dataviz-Skill: "Status never follows the theme")
        // für Kontrolle.tsx — NIE als Kategorialfarbe wiederverwendet, immer mit Icon + Text
        // kombiniert. Kontrastwerte gegen reinweiss per validate_palette.js contrast()-Export
        // geprüft: gut 4.91:1, warnung 5.03:1, kritisch 6.37:1 (alle ≥4.5:1 für Fließtext).
        status: {
          gut: "#2F7D4F",
          warnung: "#8C6712",
          kritisch: "#B3261E",
        },
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
