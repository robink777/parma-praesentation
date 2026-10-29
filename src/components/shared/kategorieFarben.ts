// Literale Tailwind-Klassennamen je Kategorie-Farbton (neutraler Farbname wie "chart-1" aus
// lib/neuzugaengeKategorisierung.ts → konkrete Utility-Klasse für SVG-Füllung bzw. HTML-
// Hintergrund). Bewusst HIER unter components/ platziert statt direkt in der lib/-Datei:
// Tailwinds Build-Scanner durchsucht laut tailwind.config.ts nur src/pages/**, src/components/**
// und src/app/** nach wörtlich vorkommenden Klassennamen — ein zur Laufzeit zusammengesetzter
// String (`` `bg-${farbe}` ``) würde NIE erkannt, egal in welcher Datei (siehe AKZENT_KLASSEN in
// components/admin/Uebersicht.tsx für dasselbe, dort bereits gelöste Problem). Zwei getrennte
// Maps, weil SVG-Balken (components/admin/Neuzugaenge.tsx) "fill-*" brauchen, HTML-Balken/-Punkte
// (components/tv/TvMobil.tsx, Legenden-Punkte) dagegen "bg-*".
export const KATEGORIE_FILL_KLASSEN: Record<string, string> = {
  "chart-1": "fill-chart-1",
  "chart-2": "fill-chart-2",
  "chart-3": "fill-chart-3",
  "chart-4": "fill-chart-4",
  "chart-5": "fill-chart-5",
  "chart-6": "fill-chart-6",
  "chart-7": "fill-chart-7",
  asche: "fill-asche",
};

export const KATEGORIE_BG_KLASSEN: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  "chart-6": "bg-chart-6",
  "chart-7": "bg-chart-7",
  asche: "bg-asche",
};
