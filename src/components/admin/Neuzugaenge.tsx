import { KATEGORIE_BG_KLASSEN, KATEGORIE_FILL_KLASSEN } from "@/components/shared/kategorieFarben";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { kategorisiere, stapelFuerTag } from "@/lib/neuzugaengeKategorisierung";
import { NeuzugaengeTag, NeuzugaengeVerteilungsEintrag } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Leadquellen.tsx/Kontrolle.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

const CHART_BREITE = 400;
const CHART_HOEHE = 180;
const OBEN_PADDING = 20; // Platz für den Wert-Label über dem höchsten Balken
const UNTEN_PADDING = 22; // Platz für die Datums-Beschriftung je Balken
const PLOT_HOEHE = CHART_HOEHE - OBEN_PADDING - UNTEN_PADDING;

// Aufschlüsselung der Balken nach Kategorie (Nutzer-Vorgabe Oktober 2026: "Neue Objekte = Status
// 2 anzeigen, Neue Adressen = Herkunft Kontakt, jeweils bitte mit Legende"). Kategorie-Zuordnung/
// -Farben kommen aus lib/neuzugaengeKategorisierung.ts (gemeinsam mit components/tv/TvMobil.tsx,
// das dieselbe Aufschlüsselung als HTML-Balken statt SVG zeigt) — "Herkunft Kontakt" bleibt dabei
// auf die 7 häufigsten Kategorien + "Sonstige" begrenzt (über 30 mögliche Werte im Feldkatalog),
// "Status 2" läuft dagegen ohne Obergrenze (siehe Neuzugaenge() unten, maxKategorien={Infinity}):
// ein geschlossenes Feld mit nur 19 möglichen Werten, und der Nutzer stellte nach einer Kontrolle
// der Einzelliste klar: "ich will dass jeder Status 2 abgefragt wird, auch zum Beispiel
// Marktbeobachtung - Bearbeitet".
const KUNDEN_MAX_KATEGORIEN = 7;

function Legende({ kategorien }: { kategorien: { label: string; farbe: string }[] }) {
  return (
    <div className="mt-[2px] flex flex-wrap items-center gap-x-sm gap-y-[2px]">
      {kategorien.map((k) => (
        <span key={k.label} className="flex items-center gap-[3px] text-[10px] text-anthrazit/50">
          <span
            className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${KATEGORIE_BG_KLASSEN[k.farbe]}`}
          />
          {k.label}
        </span>
      ))}
    </div>
  );
}

// Ein einzelnes Balkendiagramm (Objekte ODER Kunden, siehe Uebersicht.tsx, das beide
// nebeneinander einbindet) — bewusst ZWEI getrennte Ein-Serien-Diagramme statt EINES
// gruppierten Zwei-Serien-Diagramms mit gemeinsamer Skala: Kunden-Zahlen liegen pro Tag
// typischerweise deutlich über den Objekte-Zahlen (live beobachtet), eine gemeinsame Achse würde
// die Objekte-Balken fast unsichtbar neben den Kunden-Balken flachdrücken UND wäre im Kern eine
// Dual-Achsen-Darstellung mit nur einer sichtbaren Skala — genau das Muster, von dem die
// dataviz-Referenz ausdrücklich abrät ("zwei Diagramme ... statt einer Doppelachse"). Jede der
// beiden Karten bekommt stattdessen ihre EIGENE, ehrliche Skala. Innerhalb jedes Balkens jetzt
// gestapelt nach Kategorie (siehe kategorisiere() oben).
//
// Referenzlinie (Oktober 2026 Chat-Vorgabe: "mehr in Referenzen"): eine gestrichelte
// Durchschnittslinie über die abgeschlossenen Tage (OHNE den noch laufenden heutigen Tag, der
// sonst den Schnitt künstlich drücken würde) — zeigt auf einen Blick, ob der aktuelle/letzte Tag
// über oder unter dem jüngeren Normalniveau liegt, ohne eine irreführende Vergleichs-Prozentangabe
// gegen einen noch unvollständigen Tag zu bilden.
function Balkendiagramm({
  titel,
  einheit,
  tage,
  wert,
  verteilungVon,
  maxKategorien,
  info,
}: {
  titel: string;
  einheit: string;
  tage: NeuzugaengeTag[];
  wert: (tag: NeuzugaengeTag) => number | null;
  verteilungVon: (tag: NeuzugaengeTag) => NeuzugaengeVerteilungsEintrag[];
  maxKategorien: number;
  info?: { felder: string[]; text: string };
}) {
  // Chronologisch (älteste zuerst) für die Lesrichtung links→rechts — ladeNeuzugaengeVerlauf
  // liefert bewusst neueste zuerst (siehe mitarbeiterstatistik.ts), hier fürs Diagramm umgedreht.
  const chronologisch = [...tage].reverse();
  const werte = chronologisch.map((t) => wert(t) ?? 0);
  const maxWert = Math.max(1, ...werte);
  const kategorisierung = kategorisiere(chronologisch, verteilungVon, maxKategorien);

  const abgeschlosseneWerte = chronologisch
    .filter((t) => !t.label.includes("(laufend)"))
    .map((t) => wert(t))
    .filter((w): w is number => w !== null);
  const durchschnitt =
    abgeschlosseneWerte.length === 0
      ? null
      : abgeschlosseneWerte.reduce((summe, w) => summe + w, 0) / abgeschlosseneWerte.length;

  const gruppenbreite = CHART_BREITE / chronologisch.length;
  const balkenbreite = gruppenbreite * 0.55;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-xs flex shrink-0 items-center gap-xs font-slab text-lg font-bold text-anthrazit">
        {titel}
        {info && <InfoTooltip felder={info.felder} text={info.text} />}
      </p>
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
        {chronologisch.map((tag, i) => {
          const w = wert(tag) ?? 0;
          const laeuft = tag.label.includes("(laufend)");
          const balkenhoehe = maxWert === 0 ? 0 : (w / maxWert) * PLOT_HOEHE;
          const x = i * gruppenbreite + (gruppenbreite - balkenbreite) / 2;
          const yOben = OBEN_PADDING + (PLOT_HOEHE - balkenhoehe);
          // Kurzform des Datums für die Achsenbeschriftung — tag.label trägt zusätzlich ggf. den
          // Zusatz "(laufend)" (siehe NeuzugaengeTag in types/index.ts); "laufend" wird
          // stattdessen über reduzierte Deckkraft + "*" codiert, deshalb hier entfernt.
          const kurzDatum = tag.label.replace(" (laufend)", "");
          const stapel = stapelFuerTag(tag, verteilungVon, kategorisierung);

          // Segmente von UNTEN nach OBEN in fixer Kategorie-Reihenfolge (gleiche Reihenfolge wie
          // die Legende) — rückwärts durchlaufen, damit y mit jedem Segment nach oben wandert.
          let yLaufend = OBEN_PADDING + PLOT_HOEHE;
          const segmente = [...kategorisierung.kategorien].reverse().map((kat) => {
            const anzahl = stapel.get(kat.label) ?? 0;
            const segmenthoehe = maxWert === 0 ? 0 : (anzahl / maxWert) * PLOT_HOEHE;
            const y = yLaufend - segmenthoehe;
            yLaufend = y;
            return { key: kat.label, farbe: kat.farbe, y, hoehe: segmenthoehe };
          });

          return (
            <g key={tag.von}>
              {segmente
                .filter((s) => s.hoehe > 0)
                .map((s) => (
                  <rect
                    key={s.key}
                    x={x}
                    y={s.y}
                    width={balkenbreite}
                    height={s.hoehe}
                    rx={2}
                    className={KATEGORIE_FILL_KLASSEN[s.farbe]}
                    fillOpacity={laeuft ? 0.45 : 1}
                  />
                ))}
              <text
                x={x + balkenbreite / 2}
                y={yOben - 4}
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
        {einheit} je Tag · * heute, noch nicht abgeschlossen
      </p>
      <Legende kategorien={kategorisierung.kategorien} />
    </div>
  );
}

// "Neuzugänge"-Baustein der Übersicht (siehe Uebersicht.tsx) — zwei Balkendiagramme (Objekte/
// Kunden) nebeneinander, je Kalendertag der letzten `verlauf.length` Tage (Nutzer-Vorgabe
// November 2026: "die Objekte und auch die Adressen hätte ich gerne jeweils für den Tag
// angezeigt, immer die letzten 6 Tage und der aktuelle Tag" — ersetzt die zuvor gezeigten
// Kalenderwochen). Ersetzt die frühere eigene "Neuzugänge"-Navi-Seite mit Text-Balken (siehe
// adminNav.ts) — Oktober 2026 Chat-Vorgabe wollte die Statistik-Seite als EINEN auf-einen-Blick-
// lesbaren TV-Dashboard-Landingscreen mit echten Diagrammen statt eines weiteren Klickschritts.
// Balken seit der Status2-/Herkunft-Aufschlüsselung (Nutzer-Vorgabe: "Neue Objekte = Status 2
// anzeigen, Neue Adressen = Herkunft Kontakt, jeweils mit Legende") gestapelt statt einfarbig.
export function Neuzugaenge({
  verlauf,
  interaktiv = false,
}: {
  verlauf?: NeuzugaengeTag[];
  // Siehe Uebersicht.tsx — dieselbe Komponente läuft auch auf der öffentlichen TV-Folie, die
  // (i)-Erläuterungen erscheinen deshalb nur, wenn der Admin-Aufrufer das explizit anfordert.
  interaktiv?: boolean;
}) {
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
        tage={verlauf}
        wert={(t) => t.neueObjekte}
        verteilungVon={(t) => t.neueObjekteVerteilung}
        maxKategorien={Infinity}
        info={
          interaktiv
            ? {
                felder: ["erstellt_am", "status2"],
                text: "Objekte an diesem Tag, aufgeschlüsselt nach Status 2. Zählt ALLE angelegten Datensätze, auch Marktbeobachtung/Fremdobjekte.",
              }
            : undefined
        }
      />
      <Balkendiagramm
        titel="Neue Kunden"
        einheit="Kunden"
        tage={verlauf}
        wert={(t) => t.neueKunden}
        verteilungVon={(t) => t.neueKundenVerteilung}
        maxKategorien={KUNDEN_MAX_KATEGORIEN}
        info={
          interaktiv
            ? {
                felder: ["Eintragsdatum", "HerkunftKontakt"],
                text: "Adressen an diesem Tag, aufgeschlüsselt nach dem ersten Wert im Mehrfachauswahlfeld Herkunft Kontakt.",
              }
            : undefined
        }
      />
    </div>
  );
}
