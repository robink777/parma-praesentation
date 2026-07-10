import { PraesentationApp } from "@/components/layout/PraesentationApp";
import { ObjektAuswahl } from "@/components/layout/ObjektAuswahl";
import { ladePraesentationsDaten } from "@/lib/praesentation";

// Erzwingt dynamisches Rendering bei jedem Aufruf (kein statisches Caching der Seite durch
// Next.js) — explizit gesetzt, statt sich allein auf das implizite Verhalten durch searchParams
// + cache: "no-store" in callOnOfficeApi (client.ts) zu verlassen. Wichtig für die
// Unternehmenskennzahlen im "Über uns"-Reiter (siehe Unternehmen.tsx, zaehleVerkaufteObjekte/
// ladeLetzteKundennummer in onoffice/estate.ts): Verkaufte Objekte, Kunden und alle übrigen
// Live-Daten (Immobilie, Betreuer, Dokumente etc.) sollen bei JEDER neu erstellten Präsentation
// frisch aus OnOffice geladen werden, nicht aus einem gecachten Seiten-Snapshot einer früheren
// Präsentation. Einzige (bewusste) Ausnahme: die Google-Bewertung (GOOGLE_BEWERTUNG in
// data/unternehmen.ts) und Portalanfragen (PORTALANFRAGEN_JAHR) bleiben manuell gepflegte
// Konstanten — Google-Bewertung, bis die Live-Anbindung an die Places API steht (Google-API-Key
// wird noch bereitgestellt), Portalanfragen, weil das onOffice-Statistik-Modul für diesen
// Account nicht per API freigeschaltet ist (siehe Kommentar bei PORTALANFRAGEN_JAHR) — für beide
// gibt es aktuell keine Datenquelle, die bei jedem Aufruf neu abgefragt werden könnte.
export const dynamic = "force-dynamic";

// Ohne estateId (z.B. beim manuellen Aufruf der Basis-URL vor einem Kundentermin) zeigt die
// Startseite die Objektauswahl (siehe ObjektAuswahl.tsx) statt einer Präsentation — der
// Berater/die Beraterin wählt dort das Objekt aus, das anschließend über denselben
// estateId-Query-Parameter geladen wird, den auch die OnOffice-Links verwenden. Kommt der
// Aufruf hingegen direkt aus OnOffice (estateId/addressId in der URL), lädt wie bisher sofort
// die Präsentation.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ estateId?: string; addressId?: string }>;
}) {
  const params = await searchParams;

  if (!params.estateId) {
    return <ObjektAuswahl />;
  }

  const daten = await ladePraesentationsDaten(params);

  return <PraesentationApp daten={daten} />;
}
