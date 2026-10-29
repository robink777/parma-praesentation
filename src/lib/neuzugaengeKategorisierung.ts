import { NeuzugaengeVerteilungsEintrag, NeuzugaengeWoche } from "@/types";

// Gemeinsame Kategorisierungs-Logik für die "Neuzugänge"-Balken (Status2 bei "Neue Objekte",
// Herkunft Kontakt bei "Neue Kunden") — ursprünglich nur in components/admin/Neuzugaenge.tsx
// (TV/Admin-Desktop, SVG-Balken), hierher ausgelagert, als die Smartphone-Ansicht (TvMobil.tsx,
// HTML-Balken statt SVG) dieselbe Kategorie-zu-Farbe-Zuordnung brauchte — Kategorien/Farben
// dürfen sich zwischen Desktop und Mobil NIEMALS unterscheiden (dataviz-Prinzip: "Farbe folgt der
// Entität", geräteübergreifend). Reine Daten-/Zuordnungslogik ohne JSX, deshalb framework-
// unabhängig in lib/ statt components/.
export const KATEGORIE_FARBEN = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
] as const;
export const SONSTIGE_LABEL = "Sonstige";
export const SONSTIGE_FARBE = "asche";

export interface Kategorisierung {
  // Reihenfolge = Stapel-Reihenfolge (von unten nach oben) UND Legenden-Reihenfolge, nach
  // absteigender Gesamtanzahl über alle Wochen hinweg. "farbe" ist der reine Tailwind-Farbname
  // (z.B. "chart-1"), ohne "bg-"/"fill-"-Präfix — der jeweilige Aufrufer (SVG vs. HTML) hängt das
  // für sein Element passende Präfix selbst an.
  kategorien: { label: string; farbe: string }[];
  // Ordnet einen rohen Verteilungs-Label-Wert seiner Stapel-Kategorie zu (faltet alles jenseits
  // von maxKategorien in "Sonstige").
  zuordnen: (label: string) => string;
}

// maxKategorien = Infinity schaltet die "Sonstige"-Faltung komplett ab: Array.slice(0, Infinity)
// liefert dann einfach alle vorkommenden Kategorien (siehe "Neue Objekte"/Status2, ein
// geschlossenes Feld mit nur 19 möglichen Werten — anders als "Herkunft Kontakt" mit über 30).
export function kategorisiere(
  wochen: NeuzugaengeWoche[],
  verteilungVon: (w: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[],
  maxKategorien: number
): Kategorisierung {
  const gesamtJeLabel = new Map<string, number>();
  for (const woche of wochen) {
    for (const eintrag of verteilungVon(woche)) {
      gesamtJeLabel.set(eintrag.label, (gesamtJeLabel.get(eintrag.label) ?? 0) + eintrag.anzahl);
    }
  }
  const sortiert = Array.from(gesamtJeLabel.entries()).sort((a, b) => b[1] - a[1]);
  const top = sortiert.slice(0, maxKategorien).map(([label]) => label);
  const hatSonstige = sortiert.length > maxKategorien;

  const kategorien: { label: string; farbe: string }[] = top.map((label, i) => ({
    label,
    farbe: KATEGORIE_FARBEN[i % KATEGORIE_FARBEN.length],
  }));
  if (hatSonstige) kategorien.push({ label: SONSTIGE_LABEL, farbe: SONSTIGE_FARBE });

  const topSet = new Set(top);
  return { kategorien, zuordnen: (label) => (topSet.has(label) ? label : SONSTIGE_LABEL) };
}

// Fasst die Verteilung einer einzelnen Woche auf die (ggf. mit "Sonstige" gefalteten)
// Stapel-Kategorien zusammen.
export function stapelFuerWoche(
  woche: NeuzugaengeWoche,
  verteilungVon: (w: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[],
  kategorisierung: Kategorisierung
): Map<string, number> {
  const stapel = new Map<string, number>();
  for (const eintrag of verteilungVon(woche)) {
    const kategorie = kategorisierung.zuordnen(eintrag.label);
    stapel.set(kategorie, (stapel.get(kategorie) ?? 0) + eintrag.anzahl);
  }
  return stapel;
}
