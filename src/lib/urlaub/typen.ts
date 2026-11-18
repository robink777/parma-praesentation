// Gemeinsame Typen des Urlaubszählers (Server und Admin-Oberfläche).

// Jahresanspruch in Arbeitstagen (Nutzer-Vorgabe November 2026: "die haben alle 25 tage urlaub").
// Abweichungen je Person, falls es sie später gibt, hier eintragen (Name wie in data/unternehmen.ts).
export const URLAUBSANSPRUCH_TAGE = 25;
export const URLAUBSANSPRUCH_ABWEICHUNGEN: Record<string, number> = {};

export interface UrlaubsTag {
  datum: string; // YYYY-MM-DD
  anteil: number; // 1 oder 0,5
  terminId: number;
  betreff: string;
}

// Kalendereintrag, der nach Urlaub aussieht, aber nicht die Terminart "Urlaub" hat — wird nicht
// gezählt, sondern als "bitte Terminart prüfen" angezeigt (onOffice bleibt die Datenquelle).
export interface UrlaubsVerdacht {
  terminId: number;
  von: string;
  bis: string;
  betreff: string;
  terminart: string;
  arbeitstage: number;
}

export interface UrlaubsKonto {
  name: string;
  anspruch: number;
  genommen: number; // bis einschließlich heute
  geplant: number; // ab morgen bis Jahresende
  uebrig: number; // anspruch − genommen − geplant
  tage: UrlaubsTag[];
  verdacht: UrlaubsVerdacht[];
}

export type WarnungsGrund = "geloescht" | "geaendert";

// Ein Urlaubstag, der beim letzten Abgleich noch im Kalender stand und jetzt fehlt.
export interface UrlaubsWarnung {
  schluessel: string;
  name: string;
  datum: string;
  anteil: number;
  terminId: number;
  betreff: string;
  grund: WarnungsGrund; // Termin ganz gelöscht oder nur verkürzt/verschoben/Terminart geändert
  vergangen: boolean; // lag der Tag beim Erkennen schon in der Vergangenheit?
  erkanntAm: string; // ISO-Zeitpunkt
  geaendertVon?: string; // laut onOffice-Protokoll
  geaendertAm?: string; // laut onOffice-Protokoll, "YYYY-MM-DD HH:mm:ss"
  quittiertAm?: string;
}

export interface UrlaubsUebersicht {
  jahr: number;
  konten: Record<string, UrlaubsKonto>;
  warnungen: UrlaubsWarnung[]; // nur offene (nicht quittierte)
  // false, solange kein Speicher eingerichtet ist — dann zählt die App, kann aber gelöschte Tage
  // nicht erkennen (siehe lib/urlaub/speicher.ts).
  warnungenAktiv: boolean;
  // Seit wann die App den Kalender beobachtet (erster gespeicherter Stand).
  beobachtetSeit?: string;
}
