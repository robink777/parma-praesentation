import { SectionShell, Card } from "@/components/layout/SectionShell";

// Unterpunkt unter "DeepImmo" (Chat-Vorgabe, Juli 2026: "Gliedere die beiden Punkte bitte unter
// DeepImmo"). Inhalt/Zahlen 1:1 aus dem vom Nutzer mitgeschickten Schaubild übernommen ("Der
// Effekt zu hoher Vermarktungspreise in der Praxis", DeepImmo Real Estate OS Info Deck, Sommer
// 2025) — Chat-Vorgabe: "Bitte setze dies in unserer CI um, bleib aber 1 zu 1 beim Inhalt
// identisch". Farben/Bausteine daher komplett auf Parma-CI (walnuss/messing/stein/sand,
// Roboto Slab/Inter) umgestellt statt der Original-Farben (Navy/Pink), Zahlen/Texte unverändert.
//
// Bewusst OHNE das "deepimmo"-Logo und die Deck-Fußzeile "DeepImmo Real Estate OS Info Deck |
// Sommer 2025" — das ist die Eigenwerbung/Kennzeichnung des fremden Quell-Decks, kein
// Dateninhalt. Die Datenquelle selbst (Kreissparkasse Köln) bleibt als Fußnote erhalten, da sie
// zur Einordnung/Glaubwürdigkeit der Zahlen gehört.
const MARKTWERT = "420.000 €";

interface Stufe {
  aufschlagProzent: number;
  verlustLabel: string;
  schweregrad: "mild" | "mittel" | "hoch";
  tageOnline: number;
  startpreis: string;
  verkaufspreis: string;
}

const STUFEN: Stufe[] = [
  {
    aufschlagProzent: 5,
    verlustLabel: "-1%",
    schweregrad: "mild",
    tageOnline: 63,
    startpreis: "441 Tsd. €",
    verkaufspreis: "415 Tsd. €",
  },
  {
    aufschlagProzent: 10,
    verlustLabel: "-3%",
    schweregrad: "mittel",
    tageOnline: 281,
    startpreis: "462 Tsd. €",
    verkaufspreis: "407 Tsd. €",
  },
  {
    aufschlagProzent: 20,
    verlustLabel: "Verlust -15%",
    schweregrad: "hoch",
    tageOnline: 379,
    startpreis: "504 Tsd. €",
    verkaufspreis: "357 Tsd. €",
  },
];

// Rein monochrome Schweregrad-Abstufung über die vorhandene Walnuss-Farbfamilie statt erfundener
// Ampelfarben (Parma-CI kennt keine eigene Warnfarbe, siehe DatenFehltHinweis-Muster in
// Mitarbeiterstatistik.tsx) — je gravierender der Preisabschlag, desto dunkler/kräftiger die
// Füllung.
const SCHWEREGRAD_KLASSEN: Record<Stufe["schweregrad"], string> = {
  mild: "bg-sand text-walnuss",
  mittel: "bg-walnuss/20 text-walnuss",
  hoch: "bg-walnuss text-reinweiss",
};

export function PreisDesWartens() {
  return (
    <SectionShell label="Die Konsequenz" title="Der Effekt zu hoher Vermarktungspreise in der Praxis">
      <p className="mb-lg max-w-[70ch] text-body text-anthrazit/80">
        <strong className="font-medium text-anthrazit">
          Wer einmal reduziert, reduziert meist zweimal
        </strong>{" "}
        – was wie Maklerweisheit klingt, belegen Daten klar: Preisabschläge kosten Vertrauen und
        Umsatz, bezahlt von Makler:innen und Eigentümern gemeinsam.
      </p>

      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <Card className="flex flex-col justify-end text-center">
          <div className="mx-auto mb-sm h-16 w-2 rounded-full bg-messing" />
          <p className="label">Marktwert</p>
          <p className="font-slab text-xl font-bold text-walnuss">{MARKTWERT}</p>
        </Card>

        {STUFEN.map((stufe) => (
          <Card key={stufe.aufschlagProzent} className="flex flex-col text-center">
            <p className="mb-sm rounded-sm border-2 border-asche bg-reinweiss px-xs py-xs text-small font-medium text-walnuss">
              Aufschlag +{stufe.aufschlagProzent}%
            </p>
            <p
              className={`mb-sm rounded-sm px-xs py-xs text-small font-semibold ${SCHWEREGRAD_KLASSEN[stufe.schweregrad]}`}
            >
              {stufe.verlustLabel}
            </p>
            <p className="mb-sm text-small italic text-anthrazit/60">{stufe.tageOnline} Tage Online</p>
            <p className="mb-xs rounded-sm bg-stein px-xs py-xs text-small text-anthrazit">
              Startpreis von {stufe.startpreis}
            </p>
            <p className="rounded-sm bg-sand px-xs py-xs text-small font-medium text-anthrazit">
              Verkauf bei {stufe.verkaufspreis}
            </p>
          </Card>
        ))}
      </div>

      <p className="mt-lg text-small text-anthrazit/50">
        Quelle: Auswertung der Kreissparkasse Köln mit über 1.000 Verkaufsobjekten aus dem Jahr
        2023.
      </p>
    </SectionShell>
  );
}
