import { AKQUISE_NAMEN, FINANZ_NAMEN, TEAM, WETTKAMPF_NAMEN } from "@/data/unternehmen";
import {
  AKQUISE_TERMINARTEN,
  FINANZIERUNG_TERMINARTEN,
  ladeNutzerNrFuerMitarbeiter,
  zaehleAuftraegeAkquiriert,
  zaehleBesichtigungen,
  zaehleTelefonate,
  zaehleTermineNachArt,
  zaehleVerkaufteObjekteFuerMitarbeiter,
} from "./estate";

// Punktesystem für den Büro-Wettkampf (TV-Vorführung, siehe components/tv/MitarbeiterLeaderboard.tsx)
// — Oktober 2026 Chat-Vorgabe, Nutzer-Vorgabe wörtlich: "Telefonat = 1 Punkt, Besichtigung =
// 3 Punkte, Akquise 1 Termin = 6 Punkte, Akquise 2 Termin = 7 Punkte, Auftrag Akquiriert =
// 10 Punkte, Verkauf = 10 Punkte", ergänzt um "Finanzierung 1 Termin = 6 Punkte, Finanzierung 2
// Termin = 7 Punkte" (ersetzt eine zunächst angedachte, nicht sauber messbare
// "Finanzvermittlung"-Kategorie, siehe FINANZIERUNG_TERMINARTEN in estate.ts).
export const PUNKTE = {
  telefonat: 1,
  besichtigung: 3,
  akquiseErsttermin: 6,
  akquiseZweittermin: 7,
  finanzierungErsttermin: 6,
  finanzierungZweittermin: 7,
  auftragAkquiriert: 10,
  verkauf: 10,
} as const;

// Saison-Fenster: "gezählt wird seit Montag dieser Woche" (26.10.2026) "bis zum 31.12.26 ...
// danach natürlich weitergehe aber dann bis zum 31.12.27" — als rollierende Formel statt
// hartkodierter Jahreszahl gebaut, damit KEINE jährliche Code-Änderung nötig ist: Die erste
// Saison hat einen abweichenden, festen Start (26.10.2026, nicht der 1. Januar), jede folgende
// läuft automatisch 1. Januar bis 31. Dezember des jeweiligen Jahres.
const ERSTE_SAISON_START = new Date(2026, 9, 26); // 26. Oktober 2026 (Monat 0-basiert: 9 = Oktober)
const ERSTE_SAISON_ENDE = new Date(2026, 11, 31, 23, 59, 59); // 31. Dezember 2026

export function ermittleSaison(heute: Date = new Date()): { von: Date; bis: Date } {
  if (heute <= ERSTE_SAISON_ENDE) {
    return { von: ERSTE_SAISON_START, bis: ERSTE_SAISON_ENDE };
  }
  const jahr = heute.getFullYear();
  return { von: new Date(jahr, 0, 1), bis: new Date(jahr, 11, 31, 23, 59, 59) };
}

function formatiereDatumZeit(datum: Date, uhrzeit: string): string {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag} ${uhrzeit}`;
}

function formatiereDatumIso(datum: Date): string {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

// Auswahlfeld "Akquisiteur" in OnOffice (ind_2964_Feld_ObjVerwaltung384) — live geprüft, Oktober
// 2026: nur diese drei Personen sind als Wert wählbar, siehe zaehleAuftraegeAkquiriert in
// estate.ts. Jacqueline Henot ist zwar seit Kurzem auch im Akquise-Reiter (siehe AKQUISE_NAMEN),
// kann als Akquisiteur-WERT in OnOffice aber nicht ausgewählt werden — bekommt hier deshalb
// bewusst keinen Eintrag, statt einen falschen zu raten.
const AKQUISITEUR_SCHLUESSEL: Record<string, string> = {
  "Daniel Parma": "ind_Schl_4919",
  "Robin Kolbe": "ind_Schl_4917",
  "Axel Wehmeier": "ind_Schl_4915",
};

// Kategorien, aus denen sich die Punktzahl zusammensetzt — Grundlage für das gestapelte
// Balkendiagramm auf der TV-Folie (Chat-Vorgabe Oktober 2026: "Die Balken der jeweiligen
// Mitarbeiter kannst du aufteilen wie bei der Statistik der Objekte, farblich in den Balken —
// wie viele Telefonate, wie viele Termine etc., alles halt was Punkte bringt"). Feste
// Reihenfolge (wie bei den dataviz-Kategorialfarben an anderer Stelle im Dashboard) statt einer
// zur Laufzeit variablen Anordnung, damit dieselbe Kategorie auf jedem Balken immer dieselbe
// Position/Farbe hat.
export type WettkampfKategorie =
  | "telefonate"
  | "besichtigungen"
  | "akquiseTermine"
  | "finanzierungTermine"
  | "auftraege"
  | "verkaeufe";

export interface WettkampfSegment {
  kategorie: WettkampfKategorie;
  // Punkte, NICHT die rohe Anzahl — Telefonate (1 Pkt) kommen sehr viel häufiger vor als
  // Verkäufe (10 Pkt), eine nach roher Anzahl gestapelte Säule würde Verkäufe/Aufträge optisch
  // komplett verschwinden lassen, obwohl sie den Wettkampf meistens entscheiden.
  punkte: number;
}

export interface WettkampfEintrag {
  name: string;
  punkte: number;
  // Rohe Gesamtzahlen (Saison, nicht Punkte) für die TV-Kacheln — Nutzer-Vorgabe: "ich brauche
  // bei allen Mitarbeitern ja auch immer die Gesamtzahlen der einzelnen Punkte". telefonateGesamt
  // = Rohzahl Telefonate; termineGesamt = Summe aller Termin-Kategorien (Besichtigung, Akquise-
  // und Finanzierungstermine) — ohne Aufträge/Verkäufe, die sind keine "Termine".
  telefonateGesamt: number;
  termineGesamt: number;
  segmente: WettkampfSegment[];
}

// Teilnehmerkreis: siehe WETTKAMPF_NAMEN in data/unternehmen.ts — eine eigene, von den
// Admin-Statistik-Reitern (VERTRIEB_NAMEN/AKQUISE_NAMEN/FINANZ_NAMEN) entkoppelte Liste, seit
// die Nutzer-Vorgabe "nimm Daniel und mich aus der Wertung raus, nimm Sarah und Kathi mit rein"
// zeigte, dass "wer macht welchen Job" und "wer tritt beim Wettkampf an" zwei unterschiedliche
// Fragen sind.
function teilnehmerListe() {
  const namen = new Set(WETTKAMPF_NAMEN);
  return TEAM.filter((m) => namen.has(m.name));
}

async function berechnePunkte(
  mitgliedName: string,
  von: string,
  bis: string,
  vonDatum: string,
  bisDatum: string
): Promise<WettkampfEintrag> {
  const nutzerNr = ladeNutzerNrFuerMitarbeiter(mitgliedName);
  const istAkquise = AKQUISE_NAMEN.includes(mitgliedName);
  const istFinanz = FINANZ_NAMEN.includes(mitgliedName);
  const akquisiteurSchluessel = AKQUISITEUR_SCHLUESSEL[mitgliedName];

  const [
    telefonate,
    besichtigungen,
    akquiseErst,
    akquiseZweit,
    finanzErst,
    finanzZweit,
    auftraege,
    verkaeufe,
  ] = await Promise.all([
    nutzerNr ? zaehleTelefonate(nutzerNr, von, bis).catch(() => 0) : Promise.resolve(0),
    nutzerNr ? zaehleBesichtigungen(nutzerNr, von, bis).catch(() => 0) : Promise.resolve(0),
    nutzerNr && istAkquise
      ? zaehleTermineNachArt(nutzerNr, von, bis, AKQUISE_TERMINARTEN.ersttermin).catch(() => 0)
      : Promise.resolve(0),
    nutzerNr && istAkquise
      ? zaehleTermineNachArt(nutzerNr, von, bis, AKQUISE_TERMINARTEN.zweittermin).catch(() => 0)
      : Promise.resolve(0),
    nutzerNr && istFinanz
      ? zaehleTermineNachArt(nutzerNr, von, bis, FINANZIERUNG_TERMINARTEN.ersttermin).catch(() => 0)
      : Promise.resolve(0),
    nutzerNr && istFinanz
      ? zaehleTermineNachArt(nutzerNr, von, bis, FINANZIERUNG_TERMINARTEN.zweittermin).catch(() => 0)
      : Promise.resolve(0),
    akquisiteurSchluessel
      ? zaehleAuftraegeAkquiriert(akquisiteurSchluessel, vonDatum, bisDatum).catch(() => 0)
      : Promise.resolve(0),
    nutzerNr
      ? zaehleVerkaufteObjekteFuerMitarbeiter(nutzerNr, vonDatum, bisDatum).catch(() => 0)
      : Promise.resolve(0),
  ]);

  const segmente: WettkampfSegment[] = [
    { kategorie: "telefonate", punkte: telefonate * PUNKTE.telefonat },
    { kategorie: "besichtigungen", punkte: besichtigungen * PUNKTE.besichtigung },
    {
      kategorie: "akquiseTermine",
      punkte: akquiseErst * PUNKTE.akquiseErsttermin + akquiseZweit * PUNKTE.akquiseZweittermin,
    },
    {
      kategorie: "finanzierungTermine",
      punkte: finanzErst * PUNKTE.finanzierungErsttermin + finanzZweit * PUNKTE.finanzierungZweittermin,
    },
    { kategorie: "auftraege", punkte: auftraege * PUNKTE.auftragAkquiriert },
    { kategorie: "verkaeufe", punkte: verkaeufe * PUNKTE.verkauf },
  ];
  const punkte = segmente.reduce((summe, s) => summe + s.punkte, 0);
  const termineGesamt = besichtigungen + akquiseErst + akquiseZweit + finanzErst + finanzZweit;

  return { name: mitgliedName, punkte, telefonateGesamt: telefonate, termineGesamt, segmente };
}

// Live-Rangliste für den Büro-Wettkampf, absteigend nach Punkten — siehe
// components/tv/MitarbeiterLeaderboard.tsx. Jeder Teilnehmer unabhängig per .catch() abgesichert
// (Muster wie ladeMitarbeiterKennzahlen), ein einzelner fehlgeschlagener Abruf soll nicht die
// ganze Rangliste leeren.
export async function ladeWettkampfRangliste(): Promise<WettkampfEintrag[]> {
  const { von, bis } = ermittleSaison();
  const vonZeit = formatiereDatumZeit(von, "00:00:00");
  const bisZeit = formatiereDatumZeit(bis, "23:59:59");
  const vonDatum = formatiereDatumIso(von);
  const bisDatum = formatiereDatumIso(bis);

  const eintraege = await Promise.all(
    teilnehmerListe().map((mitglied) =>
      berechnePunkte(mitglied.name, vonZeit, bisZeit, vonDatum, bisDatum).catch(
        (): WettkampfEintrag => ({
          name: mitglied.name,
          punkte: 0,
          telefonateGesamt: 0,
          termineGesamt: 0,
          segmente: [],
        })
      )
    )
  );

  return eintraege.sort((a, b) => b.punkte - a.punkte);
}
