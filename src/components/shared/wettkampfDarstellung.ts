import type { WettkampfKategorie } from "@/lib/onoffice/wettkampf";

// Darstellungs-Konstanten für die Wettkampf-Punkte-Kategorien (siehe onoffice/wettkampf.ts,
// WettkampfSegment) — gemeinsam genutzt von components/tv/MitarbeiterLeaderboard.tsx (TV-Folie)
// und components/tv/TvMobil.tsx (Smartphone-Ansicht), damit Farben/Labels/Punktwerte auf beiden
// Oberflächen garantiert identisch bleiben. NUR type-only Import von WettkampfKategorie oben
// (kein Wert-Import!) — wettkampf.ts lädt serverseitigen OnOffice-Code, ein Wert-Import würde den
// in jeden Client-Bundle ziehen, der diese Datei importiert (siehe ausführlicher Kommentar dazu,
// der früher hier bei SEGMENT_FARBEN in MitarbeiterLeaderboard.tsx stand).
//
// Feste Reihenfolge/Farben je Kategorie (dataviz-Prinzip: Kategorialfarben nie zur Laufzeit neu
// zugewiesen) — sechs unterscheidbare Töne aus der bereits validierten chart-Palette (siehe
// tailwind.config.ts), hier frei von der Bedeutung, die dieselben Töne z.B. in Uebersicht.tsx
// tragen (dort Objekt-Status, hier Aktivitätsart — zwei verschiedene Dimensionen).
export const SEGMENT_REIHENFOLGE: WettkampfKategorie[] = [
  "telefonate",
  "besichtigungen",
  "akquiseTermine",
  "finanzierungTermine",
  "auftraege",
  "verkaeufe",
];

export const SEGMENT_FARBEN: Record<WettkampfKategorie, string> = {
  telefonate: "bg-chart-2",
  besichtigungen: "bg-chart-5",
  akquiseTermine: "bg-chart-4",
  finanzierungTermine: "bg-chart-8",
  auftraege: "bg-chart-7",
  verkaeufe: "bg-chart-1",
};

export const SEGMENT_LABEL: Record<WettkampfKategorie, string> = {
  telefonate: "Telefonate",
  besichtigungen: "Besichtigungen",
  akquiseTermine: "Akquise-Termine",
  finanzierungTermine: "Finanzierungs-Termine",
  auftraege: "Aufträge",
  verkaeufe: "Verkäufe",
};

// Werte bewusst hier als Text dupliziert statt PUNKTE aus wettkampf.ts zu importieren (siehe
// Hinweis oben zum Wert-Import). Bei einer Änderung an PUNKTE in wettkampf.ts muss dieser Text
// von Hand mitgezogen werden.
export const SEGMENT_PUNKTE_TEXT: Record<WettkampfKategorie, string> = {
  telefonate: "1 Pkt.",
  besichtigungen: "3 Pkt.",
  akquiseTermine: "6/7 Pkt.",
  finanzierungTermine: "6/7 Pkt.",
  auftraege: "10 Pkt.",
  verkaeufe: "10 Pkt.",
};
