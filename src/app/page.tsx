import { PraesentationApp } from "@/components/layout/PraesentationApp";
import { ObjektAuswahl } from "@/components/layout/ObjektAuswahl";
import { ladePraesentationsDaten } from "@/lib/praesentation";

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
