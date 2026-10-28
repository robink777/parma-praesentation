import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import {
  ladeMitarbeiterKennzahlen,
  ladeNeuzugaengeVerlauf,
  ladeObjektGesamtKennzahlen,
} from "@/lib/onoffice/mitarbeiterstatistik";
import {
  ladeAlleMitarbeiter,
  ladeKontrollObjekte,
  ladeLeadquellenKennzahlen,
  ladeObjektkarteDaten,
} from "@/lib/onoffice/estate";
import {
  Betreuer,
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  NeuzugaengeWoche,
  ObjektGesamtKennzahlen,
  ObjektkarteDaten,
} from "@/types";

// Admin-Bereich, zusätzlich zur App-weiten Anmeldung durch ein zweites, separates Passwort
// geschützt (siehe middleware.ts, lib/auth.ts, admin/login/page.tsx). EINE Seite für das gesamte
// Dashboard (Übersicht/Karte/Mitarbeiter/Leadquellen/Kontrolle, siehe AdminDashboard.tsx) — bis
// Oktober 2026 kurzzeitig auf zwei Routen aufgeteilt (siehe Git-Historie, app/admin/statistik/),
// direkt danach wieder zusammengeführt (Chat-Vorgabe: "Damit können wir uns den Bereich
// 'Karten/Statistik/Finanz' sparen").
export default async function AdminPage() {
  let kennzahlen: Record<string, MitarbeiterKennzahlen> | undefined;
  let gesamtKennzahlen: ObjektGesamtKennzahlen | undefined;
  let kontrollObjekte: KontrollObjekt[] | undefined;
  let leadquellenKennzahlen: LeadquellenKennzahlen | undefined;
  let objektkarteDaten: ObjektkarteDaten | undefined;
  let neuzugaengeVerlauf: NeuzugaengeWoche[] | undefined;
  let alleMitarbeiter: Betreuer[] | undefined;

  if (ONOFFICE_MODE === "live") {
    // Sieben Abrufe gleichzeitig (Promise.all), jeder einzeln per .catch() abgesichert — ein
    // einzelner fehlgeschlagener Abruf (z.B. transienter OnOffice-Verbindungsfehler trotz Retry,
    // siehe onoffice/client.ts) soll nicht die ganze Seite abstürzen lassen, sondern nur den
    // betroffenen Abschnitt in seinen eigenen "nicht geladen"-Zustand versetzen.
    const [
      kennzahlenErgebnis,
      gesamtKennzahlenErgebnis,
      kontrollErgebnis,
      leadquellenErgebnis,
      objektkarteErgebnis,
      neuzugaengeVerlaufErgebnis,
      alleMitarbeiterErgebnis,
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
    kennzahlen = kennzahlenErgebnis;
    gesamtKennzahlen = gesamtKennzahlenErgebnis;
    kontrollObjekte = kontrollErgebnis;
    leadquellenKennzahlen = leadquellenErgebnis;
    objektkarteDaten = objektkarteErgebnis;
    neuzugaengeVerlauf = neuzugaengeVerlaufErgebnis;
    alleMitarbeiter = alleMitarbeiterErgebnis;
  }

  return (
    <AdminDashboard
      kennzahlen={kennzahlen}
      gesamtKennzahlen={gesamtKennzahlen}
      kontrollObjekte={kontrollObjekte}
      leadquellenKennzahlen={leadquellenKennzahlen}
      objektkarteDaten={objektkarteDaten}
      neuzugaengeVerlauf={neuzugaengeVerlauf}
      alleMitarbeiter={alleMitarbeiter}
    />
  );
}
