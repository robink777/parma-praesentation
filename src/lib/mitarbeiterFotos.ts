import { Betreuer } from "@/types";

// Initialen-Avatar-Text für Mitarbeiter ohne Profilfoto (siehe fotoLookup unten) — "Max
// Mustermann" -> "MM". Aus Unternehmen.tsx hierher ausgelagert (Oktober 2026), damit der
// Admin-Mitarbeiterbereich (MitarbeiterBereich.tsx) dieselbe Zuordnungslogik nutzen kann, statt
// sie ein zweites Mal nachzubauen und dabei leicht abweichen zu lassen.
export function initialen(name: string) {
  const teile = name.trim().split(/\s+/);
  const erster = teile[0]?.charAt(0) || "";
  const letzter = teile.length > 1 ? teile[teile.length - 1].charAt(0) : "";
  return `${erster}${letzter}`.toUpperCase() || "?";
}

// Ordnet TEAM-Namen ("Vorname Nachname", siehe data/unternehmen.ts) den live aus OnOffice
// geladenen Profilfoto-URLs zu (siehe ladeAlleMitarbeiter in onoffice/estate.ts) — die
// TEAM-Stammdaten selbst tragen kein Profilfoto-Feld und keine OnOffice-Adress-ID, die
// Zuordnung läuft deshalb über einen Namensabgleich mit Betreuer.vorname + " " + .nachname.
// Kein Treffer (oder Mock-Modus ohne hinterlegtes Foto) -> kein Eintrag, Aufrufer zeigen dann
// einen Initialen-Avatar (siehe initialen oben).
export function fotoLookup(alleMitarbeiter: Betreuer[]): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const m of alleMitarbeiter) {
    const voller = [m.vorname, m.nachname].filter(Boolean).join(" ");
    if (voller && m.profilbildUrl) lookup[voller] = m.profilbildUrl;
  }
  return lookup;
}

// Baut die proxied Bild-URL für app/api/mitarbeiterfoto/route.ts — November 2026, Live-Diagnose
// nach "Die Bilder laden nach wie vor nicht auf meinem Fernseher": Die onOffice-Foto-URLs
// funktionieren zuverlässig bei einem Server-Abruf, liefern aber "402 Payment Required", sobald
// der BROWSER sie direkt lädt (siehe ausführlichen Kommentar in der Proxy-Route). ALLE Stellen,
// die ein Mitarbeiter-/Betreuerfoto direkt im Browser rendern (MitarbeiterFoto.tsx,
// Kontaktperson.tsx, Unternehmen.tsx, MitarbeiterBereich.tsx), müssen deshalb über diesen Proxy
// gehen statt die rohe profilbildUrl direkt als Bild-src zu verwenden — ein zentraler Helfer
// statt viermal denselben URL-Aufbau zu wiederholen.
export function fotoProxyUrl(fotoUrl: string): string {
  return `/api/mitarbeiterfoto?url=${encodeURIComponent(fotoUrl)}`;
}
