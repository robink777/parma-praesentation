import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { Bewertung as BewertungTyp } from "@/types";

function formatEuro(wert?: number) {
  if (wert === undefined) return "—";
  return `${wert.toLocaleString("de-DE")} €`;
}

// Zeigt ausschließlich die drei live aus OnOffice geladenen PriceHubble-Marktwertfelder
// (marktwertPH/marktwertMinPH/marktwertMaxPH, siehe ladePriceHubbleWerte in onoffice/estate.ts).
// Die übrigen Bewertungsfelder (Sachwert/Ertragswert/Vergleichswert, empfohlener
// Angebotspreis, das verlinkte PDF sowie der vollständige Sprengnetter-Wertermittlungsbericht)
// wurden auf Kundenwunsch (Juli 2026) bewusst ausgeblendet — NICHT gelöscht: Der Bewertung-Typ,
// die zugehörigen Daten (data/wertermittlung.ts) und die Nutzung in Maklervertrag.tsx sowie im
// Mandat-PDF-Export bleiben unverändert bestehen, nur dieser Reiter zeigt sie nicht mehr an.
export function Bewertung({ bewertung }: { bewertung: BewertungTyp }) {
  const hatPriceHubble = bewertung.marktwertPH !== undefined;

  return (
    <SectionShell label="Bewertung" title="Automatisch ermittelter Marktwert">
      {hatPriceHubble ? (
        <>
          <Card className="mb-lg border-2 border-messing">
            <p className="label mb-xs">Geschätzter Marktwert (PriceHubble)</p>
            <p className="font-slab text-4xl font-extrabold text-anthrazit">
              {formatEuro(bewertung.marktwertPH)}
            </p>
          </Card>

          <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
            <Card>
              <p className="label mb-xs">Preisspanne von</p>
              <p className="font-slab text-2xl font-bold text-walnuss">
                {formatEuro(bewertung.marktwertMinPH)}
              </p>
            </Card>
            <Card>
              <p className="label mb-xs">Preisspanne bis</p>
              <p className="font-slab text-2xl font-bold text-walnuss">
                {formatEuro(bewertung.marktwertMaxPH)}
              </p>
            </Card>
          </div>

          <p className="max-w-[60ch] text-small text-anthrazit/60">
            Automatisch anhand von PriceHubble-Marktdaten ermittelte Schätzung — ersetzt keine
            individuelle Wertermittlung, dient aber als erste Orientierung für das Gespräch.
          </p>
        </>
      ) : (
        <Card className="flex flex-col items-center gap-sm py-2xl text-center">
          <Icon name="scale" size={32} className="text-anthrazit/40" />
          <p className="max-w-[50ch] text-body text-anthrazit/70">
            Für dieses Objekt liegt noch keine PriceHubble-Marktwertschätzung in OnOffice vor.
          </p>
        </Card>
      )}
    </SectionShell>
  );
}
