import { StatistikAnsicht } from "@/components/admin/StatistikAnsicht";
import { ONOFFICE_MODE } from "@/lib/onoffice/config";
import {
  ladeMitarbeiterKennzahlen,
  ladeNeuzugaengeVerlauf,
  ladeObjektGesamtKennzahlen,
} from "@/lib/onoffice/mitarbeiterstatistik";
import { ladeKontrollObjekte, ladeLeadquellenKennzahlen, ladeObjektkarteDaten } from "@/lib/onoffice/estate";
import {
  KontrollObjekt,
  LeadquellenKennzahlen,
  MitarbeiterKennzahlen,
  NeuzugaengeWoche,
  ObjektGesamtKennzahlen,
  ObjektkarteDaten,
} from "@/types";

// Hauptbereich "Statistik" (siehe app/admin/page.tsx für den Hauptbereich "Karte", der bis
// Oktober 2026 beides in einer Seite vereinte) — Mitarbeiter/Leadquellen/Kontrolle/PLZ/Übersicht,
// jetzt als eigene, vollflächige Route statt im schmalen 1/3-Panel. `searchParams` nimmt den
// Tiefen-Link vom Karten-Klick entgegen (siehe KartenAnsicht.tsx, `onPlzKlick`): `tab=plz` +
// `plz`/`ort` öffnen direkt den passenden Reiter mit der geklickten Fläche vorausgewählt, analog
// zum früheren lokalen `gewaehltePlz`-State, nur jetzt über eine echte Routen-Grenze hinweg.
export default async function StatistikPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; plz?: string; ort?: string }>;
}) {
  const params = await searchParams;

  let kennzahlen: Record<string, MitarbeiterKennzahlen> | undefined;
  let gesamtKennzahlen: ObjektGesamtKennzahlen | undefined;
  let kontrollObjekte: KontrollObjekt[] | undefined;
  let leadquellenKennzahlen: LeadquellenKennzahlen | undefined;
  let objektkarteDaten: ObjektkarteDaten | undefined;
  let neuzugaengeVerlauf: NeuzugaengeWoche[] | undefined;

  if (ONOFFICE_MODE === "live") {
    // Fünf Abrufe gleichzeitig (Promise.all), jeder einzeln per .catch() abgesichert — gleiches
    // Muster wie zuvor in app/admin/page.tsx, siehe dort für die Begründung.
    const [
      kennzahlenErgebnis,
      gesamtKennzahlenErgebnis,
      kontrollErgebnis,
      leadquellenErgebnis,
      objektkarteErgebnis,
      neuzugaengeVerlaufErgebnis,
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
      // Weiterhin gebraucht für den PLZ-Reiter (siehe PlzObjekte.tsx) — nicht nur die Karte selbst.
      ladeObjektkarteDaten().catch((error) => {
        console.error("Live-Abruf der Objektkarte aus OnOffice fehlgeschlagen:", error);
        return undefined;
      }),
      ladeNeuzugaengeVerlauf().catch((error) => {
        console.error("Live-Abruf des Neuzugänge-Verlaufs aus OnOffice fehlgeschlagen:", error);
        return undefined;
      }),
    ]);
    kennzahlen = kennzahlenErgebnis;
    gesamtKennzahlen = gesamtKennzahlenErgebnis;
    kontrollObjekte = kontrollErgebnis;
    leadquellenKennzahlen = leadquellenErgebnis;
    objektkarteDaten = objektkarteErgebnis;
    neuzugaengeVerlauf = neuzugaengeVerlaufErgebnis;
  }

  return (
    <StatistikAnsicht
      kennzahlen={kennzahlen}
      gesamtKennzahlen={gesamtKennzahlen}
      kontrollObjekte={kontrollObjekte}
      leadquellenKennzahlen={leadquellenKennzahlen}
      objektkarteDaten={objektkarteDaten}
      neuzugaengeVerlauf={neuzugaengeVerlauf}
      initialAbschnitt={params.tab === "plz" ? "plz" : undefined}
      initialPlz={params.plz}
      initialOrt={params.ort}
    />
  );
}
