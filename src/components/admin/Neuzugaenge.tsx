import { NeuzugaengeWoche } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Leadquellen.tsx/Kontrolle.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

const CHART_BREITE = 400;
const CHART_HOEHE = 180;
const OBEN_PADDING = 20; // Platz für den Wert-Label über dem höchsten Balken
const UNTEN_PADDING = 22; // Platz für die Datums-Beschriftung je Balken
const PLOT_HOEHE = CHART_HOEHE - OBEN_PADDING - UNTEN_PADDING;

// Ein einzelnes Balkendiagramm (Objekte ODER Kunden, siehe Uebersicht.tsx, das beide
// nebeneinander einbindet) — bewusst ZWEI getrennte Ein-Serien-Diagramme statt EINES
// gruppierten Zwei-Serien-Diagramms mit gemeinsamer Skala: Kunden-Zahlen liegen pro Woche
// typischerweise 3-5× über den Objekte-Zahlen (live beobachtet), eine gemeinsame Achse würde die
// Objekte-Balken fast unsichtbar neben den Kunden-Balken flachdrücken UND wäre im Kern eine
// Dual-Achsen-Darstellung mit nur einer sichtbaren Skala — genau das Muster, von dem die
// dataviz-Referenz ausdrücklich abrät ("zwei Diagramme ... statt einer Doppelachse"). Jede der
// beiden Karten bekommt stattdessen ihre EIGENE, ehrliche Skala.
//
// Referenzlinie (Oktober 2026 Chat-Vorgabe: "mehr in Referenzen"): eine gestrichelte
// Durchschnittslinie über die abgeschlossenen Wochen (OHNE die noch laufende aktuelle Woche, die
// sonst den Schnitt künstlich drücken würde) — zeigt auf einen Blick, ob die aktuelle/letzte Woche
// über oder unter dem jüngeren Normalniveau liegt, ohne eine irreführende Wochenvergleich-Prozent-
// angabe gegen eine noch unvollständige Woche zu bilden.
function Balkendiagramm({
  titel,
  einheit,
  wochen,
  wert,
  farbKlasse,
}: {
  titel: string;
  einheit: string;
  wochen: NeuzugaengeWoche[];
  wert: (woche: NeuzugaengeWoche) => number | null;
  farbKlasse: string;
}) {
  // Chronologisch (älteste zuerst) für die Lesrichtung links→rechts — ladeNeuzugaengeVerlauf
  // liefert bewusst neueste zuerst (siehe mitarbeiterstatistik.ts), hier fürs Diagramm umgedreht.
  const chronologisch = [...wochen].reverse();
  const werte = chronologisch.map((w) => wert(w) ?? 0);
  const maxWert = Math.max(1, ...werte);

  const abgeschlosseneWerte = chronologisch
    .filter((w) => !w.label.includes("(laufend)"))
    .map((w) => wert(w))
    .filter((w): w is number => w !== null);
  const durchschnitt =
    abgeschlosseneWerte.length === 0
      ? null
      : abgeschlosseneWerte.reduce((summe, w) => summe + w, 0) / abgeschlosseneWerte.length;

  const gruppenbreite = CHART_BREITE / chronologisch.length;
  const balkenbreite = gruppenbreite * 0.55;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-xs shrink-0 font-slab text-lg font-bold text-anthrazit">{titel}</p>
      <div className="min-h-0 flex-1">
      <svg
        viewBox={`0 0 ${CHART_BREITE} ${CHART_HOEHE}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label={titel}
      >
        {durchschnitt !== null && (
          <>
            <line
              x1={0}
              x2={CHART_BREITE}
              y1={OBEN_PADDING + (PLOT_HOEHE - (durchschnitt / maxWert) * PLOT_HOEHE)}
              y2={OBEN_PADDING + (PLOT_HOEHE - (durchschnitt / maxWert) * PLOT_HOEHE)}
              stroke="#A9A29A"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={CHART_BREITE}
              y={OBEN_PADDING + (PLOT_HOEHE - (durchschnitt / maxWert) * PLOT_HOEHE) - 4}
              textAnchor="end"
              className="fill-anthrazit/50 font-mono text-[9px]"
            >
              Ø {zahlenformat.format(Math.round(durchschnitt))}
            </text>
          </>
        )}
        {chronologisch.map((woche, i) => {
          const w = wert(woche) ?? 0;
          const laeuft = woche.label.includes("(laufend)");
          const balkenhoehe = maxWert === 0 ? 0 : (w / maxWert) * PLOT_HOEHE;
          const x = i * gruppenbreite + (gruppenbreite - balkenbreite) / 2;
          const y = OBEN_PADDING + (PLOT_HOEHE - balkenhoehe);
          // Kurzform des Datums für die Achsenbeschriftung — woche.label trägt zusätzlich das
          // Enddatum und ggf. "(laufend)" (siehe NeuzugaengeWoche in types/index.ts), hier reicht
          // das Startdatum; "laufend" wird stattdessen über reduzierte Deckkraft + "*" codiert.
          const kurzDatum = woche.label.split("–")[0];
          return (
            <g key={woche.von}>
              <rect
                x={x}
                y={y}
                width={balkenbreite}
                height={balkenhoehe}
                rx={3}
                className={farbKlasse}
                fillOpacity={laeuft ? 0.45 : 1}
              />
              <text
                x={x + balkenbreite / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-anthrazit font-mono text-[10px] font-medium"
              >
                {zahlenformat.format(w)}
              </text>
              <text
                x={x + balkenbreite / 2}
                y={CHART_HOEHE - 6}
                textAnchor="middle"
                className="fill-anthrazit/50 font-mono text-[9px]"
              >
                {kurzDatum}
                {laeuft ? "*" : ""}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <p className="mt-[2px] shrink-0 text-small text-anthrazit/40">
        {einheit} je Kalenderwoche · * aktuelle Woche, noch nicht abgeschlossen
      </p>
    </div>
  );
}

// "Neuzugänge"-Baustein der Übersicht (siehe Uebersicht.tsx) — zwei Balkendiagramme (Objekte/
// Kunden) nebeneinander, je Kalenderwoche der letzten `verlauf.length` Wochen. Ersetzt die
// frühere eigene "Neuzugänge"-Navi-Seite mit Text-Balken (siehe adminNav.ts) — Oktober 2026
// Chat-Vorgabe wollte die Statistik-Seite als EINEN auf-einen-Blick-lesbaren TV-Dashboard-
// Landingscreen mit echten Diagrammen statt eines weiteren Klickschritts.
export function Neuzugaenge({ verlauf }: { verlauf?: NeuzugaengeWoche[] }) {
  if (verlauf === undefined) {
    return (
      <p className="text-small text-anthrazit/50">Neuzugänge konnten nicht geladen werden.</p>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-md md:grid-cols-2">
      <Balkendiagramm
        titel="Neue Objekte"
        einheit="Objekte"
        wochen={verlauf}
        wert={(w) => w.neueObjekte}
        farbKlasse="fill-chart-1"
      />
      <Balkendiagramm
        titel="Neue Kunden"
        einheit="Kunden"
        wochen={verlauf}
        wert={(w) => w.neueKunden}
        farbKlasse="fill-chart-2"
      />
    </div>
  );
}
