import { ONOFFICE_MODE } from "./config";
import { ladeMitarbeiterKennzahlen, ladeNeuzugaengeVerlauf, ladeObjektGesamtKennzahlen } from "./mitarbeiterstatistik";
import { ladeAlleMitarbeiter, ladeKontrollObjekte, ladeLeadquellenKennzahlen, ladeObjektkarteDaten } from "./estate";
import {
  Betreuer,
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  NeuzugaengeWoche,
  ObjektGesamtKennzahlen,
  ObjektkarteDaten,
} from "@/types";

export interface AdminDashboardDaten {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  gesamtKennzahlen?: ObjektGesamtKennzahlen;
  kontrollObjekte?: KontrollObjekt[];
  leadquellenKennzahlen?: LeadquellenKennzahlen;
  objektkarteDaten?: ObjektkarteDaten;
  neuzugaengeVerlauf?: NeuzugaengeWoche[];
  alleMitarbeiter?: Betreuer[];
}

// Gemeinsamer Datenabruf für ALLE Oberflächen, die auf denselben Live-Kennzahlen aufbauen —
// bisher nur app/admin/page.tsx, seit Oktober 2026 auch app/tv/page.tsx (Chat-Vorgabe: "alles,
// was in dieser Oberfläche zu sehen ist, muss immer repräsentativ sein ... die richtigen Daten"
// — die TV-Vorführung zeigt deshalb bewusst dieselben Live-Abrufe wie der Admin-Bereich, kein
// eigener, u.U. abweichender zweiter Ladepfad). Vorher inline in admin/page.tsx, hierher
// ausgelagert statt dupliziert, als die TV-Seite denselben Datensatz brauchte.
//
// Sieben Abrufe gleichzeitig (Promise.all), jeder einzeln per .catch() abgesichert — ein
// einzelner fehlgeschlagener Abruf (z.B. transienter OnOffice-Verbindungsfehler trotz Retry,
// siehe onoffice/client.ts) soll nicht die ganze Seite abstürzen lassen, sondern nur den
// betroffenen Abschnitt in seinen eigenen "nicht geladen"-Zustand versetzen.
export async function ladeAdminDashboardDaten(): Promise<AdminDashboardDaten> {
  if (ONOFFICE_MODE !== "live") return {};

  const [
    kennzahlen,
    gesamtKennzahlen,
    kontrollObjekte,
    leadquellenKennzahlen,
    objektkarteDaten,
    neuzugaengeVerlauf,
    alleMitarbeiter,
  ] = await Promise.all([
    ladeMitarbeiterKennzahlen().catch((error) => {
      console.error("Live-Abruf der Mitarbeiterstatistik aus OnOffice fehlgeschlagen:", error);
      return undefined;
    }),
    ladeObjektGesamtKennzahlen().catch((error) => {
      console.error(
        "Live-Abruf der unternehmensweiten Objekt-Gesamtkennzahlen aus OnOffice fehlgeschlagen:",
        error
      );
      return undefined;
    }),
    ladeKontrollObjekte().catch((error) => {
      console.error("Live-Abruf der Kontrollobjekte aus OnOffice fehlgeschlagen:", error);
      return undefined;
    }),
    ladeLeadquellenKennzahlen().catch((error) => {
      console.error("Live-Abruf der Leadquellen aus OnOffice fehlgeschlagen:", error);
      return undefined;
    }),
    ladeObjektkarteDaten().catch((error) => {
      console.error("Live-Abruf der Objektkarte aus OnOffice fehlgeschlagen:", error);
      return undefined;
    }),
    ladeNeuzugaengeVerlauf().catch((error) => {
      console.error("Live-Abruf des Neuzugänge-Verlaufs aus OnOffice fehlgeschlagen:", error);
      return undefined;
    }),
    ladeAlleMitarbeiter().catch((error) => {
      console.error("Live-Abruf der Mitarbeiterfotos aus OnOffice fehlgeschlagen:", error);
      return undefined;
    }),
  ]);

  return {
    kennzahlen,
    gesamtKennzahlen,
    kontrollObjekte,
    leadquellenKennzahlen,
    objektkarteDaten,
    neuzugaengeVerlauf,
    alleMitarbeiter,
  };
}
