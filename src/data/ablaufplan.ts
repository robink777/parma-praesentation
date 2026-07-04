import { Ablaufpunkt } from "@/types";

// Standard-Ablaufplan für den Präsentationstermin — pro Termin individuell anpassbar.
export const STANDARD_ABLAUFPLAN: Ablaufpunkt[] = [
  { uhrzeit: "10:00", titel: "Begrüßung & Kennenlernen", beschreibung: "Kurzer Überblick über den Ablauf des Termins" },
  { uhrzeit: "10:10", titel: "Parma Immobilien vorstellen", beschreibung: "Team, Standorte, Leistungen" },
  { uhrzeit: "10:25", titel: "Objektdaten besprechen", beschreibung: "Eckdaten, Zustand, Modernisierungen" },
  { uhrzeit: "10:40", titel: "Bewertung erläutern", beschreibung: "Sachwert, Ertragswert, Vergleichswert" },
  { uhrzeit: "11:00", titel: "Vergleichbare Objekte zeigen", beschreibung: "Marktvergleich anhand ähnlicher Immobilien" },
  { uhrzeit: "11:15", titel: "Finanzierung durchrechnen", beschreibung: "Individuelle Finanzierungsoptionen" },
  { uhrzeit: "11:35", titel: "Vermarktungsstrategie", beschreibung: "Zeitplan bis zum Verkauf" },
  { uhrzeit: "11:50", titel: "Angebot & nächste Schritte", beschreibung: "Zusammenfassung und Entscheidung" },
];
