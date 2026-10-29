import { NeuzugaengeVerteilungsEintrag, NeuzugaengeWoche } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Leadquellen.tsx/Kontrolle.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

const CHART_BREITE = 400;
const CHART_HOEHE = 180;
const OBEN_PADDING = 20; // Platz für den Wert-Label über dem höchsten Balken
const UNTEN_PADDING = 22; // Platz für die Datums-Beschriftung je Balken
const PLOT_HOEHE = CHART_HOEHE - OBEN_PADDING - UNTEN_PADDING;

// Aufschlüsselung der Balken nach Kategorie (Nutzer-Vorgabe Oktober 2026: "Neue Objekte = Status
// 2 anzeigen, Neue Adressen = Herkunft Kontakt, jeweils bitte mit Legende" — nach demselben
// Stapel-Prinzip wie die Wettkampf-Säulen auf der TV-Mitarbeiter-Folie, siehe
// AktivitaetenSaeule in components/tv/MitarbeiterLeaderboard.tsx). Maximal MAX_KATEGORIEN eigene
// Farben, der Rest fällt in eine neutrale "Sonstige"-Sammelkategorie (dataviz-Prinzip: Überlauf
// nie als weitere, beliebige Kategorialfarbe, sondern grau gebündelt) — wichtig vor allem bei
// "Herkunft Kontakt", wo der Feldkatalog über 30 mögliche Werte kennt, während bei "Status 2"
// in der Praxis meist nur eine Handvoll Werte pro Wochen-Fenster vorkommt.
//
// Wiederverwendet bewusst dieselben chart-1…7-Töne, die weiter oben auf derselben Seite
// (Uebersicht.tsx) schon für die acht KPI-Kacheln stehen — andere Bedeutung auf derselben Fläche,
// aber jeder Balken trägt seine eigene, direkt daneben stehende Legende, es entsteht keine
// Verwechslungsgefahr zwischen KPI-Kachel-Farbe und Balken-Segment-Farbe.
const MAX_KATEGORIEN = 7;
const KATEGORIE_FARBEN = [
  "fill-chart-1",
  "fill-chart-2",
  "fill-chart-3",
  "fill-chart-4",
  "fill-chart-5",
  "fill-chart-6",
  "fill-chart-7",
] as const;
const SONSTIGE_LABEL = "Sonstige";
const SONSTIGE_FARBE = "fill-asche";

interface Kategorisierung {
  // Reihenfolge = Stapel-Reihenfolge (von unten nach oben) UND Legenden-Reihenfolge, nach
  // absteigender Gesamtanzahl über alle Wochen hinweg.
  kategorien: { label: string; farbKlasse: string }[];
  // Ordnet einen rohen Verteilungs-Label-Wert seiner Stapel-Kategorie zu (faltet alles jenseits
  // von MAX_KATEGORIEN in "Sonstige").
  zuordnen: (label: string) => string;
}

function kategorisiere(
  wochen: NeuzugaengeWoche[],
  verteilungVon: (w: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[]
): Kategorisierung {
  const gesamtJeLabel = new Map<string, number>();
  for (const woche of wochen) {
    for (const eintrag of verteilungVon(woche)) {
      gesamtJeLabel.set(eintrag.label, (gesamtJeLabel.get(eintrag.label) ?? 0) + eintrag.anzahl);
    }
  }
  const sortiert = Array.from(gesamtJeLabel.entries()).sort((a, b) => b[1] - a[1]);
  const top = sortiert.slice(0, MAX_KATEGORIEN).map(([label]) => label);
  const hatSonstige = sortiert.length > MAX_KATEGORIEN;

  const kategorien: { label: string; farbKlasse: string }[] = top.map((label, i) => ({
    label,
    farbKlasse: KATEGORIE_FARBEN[i],
  }));
  if (hatSonstige) kategorien.push({ label: SONSTIGE_LABEL, farbKlasse: SONSTIGE_FARBE });

  const topSet = new Set(top);
  return { kategorien, zuordnen: (label) => (topSet.has(label) ? label : SONSTIGE_LABEL) };
}

// Fasst die Verteilung einer einzelnen Woche auf die (ggf. mit "Sonstige" gefalteten)
// Stapel-Kategorien zusammen.
function stapelFuerWoche(
  woche: NeuzugaengeWoche,
  verteilungVon: (w: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[],
  kategorisierung: Kategorisierung
): Map<string, number> {
  const stapel = new Map<string, number>();
  for (const eintrag of verteilungVon(woche)) {
    const kategorie = kategorisierung.zuordnen(eintrag.label);
    stapel.set(kategorie, (stapel.get(kategorie) ?? 0) + eintrag.anzahl);
  }
  return stapel;
}

function Legende({ kategorien }: { kategorien: { label: string; farbKlasse: string }[] }) {
  // "fill-chart-1" → "bg-chart-1" für den Legenden-Punkt (gleicher Farbton, anderes CSS-Attribut
  // als im SVG-Balken).
  return (
    <div className="mt-[2px] flex flex-wrap items-center gap-x-sm gap-y-[2px]">
      {kategorien.map((k) => (
        <span key={k.label} className="flex items-center gap-[3px] text-[10px] text-anthrazit/50">
          <span
            className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${k.farbKlasse.replace("fill-", "bg-")}`}
          />
          {k.label}
        </span>
      ))}
    </div>
  );
}

// Ein einzelnes Balkendiagramm (Objekte ODER Kunden, siehe Uebersicht.tsx, das beide
// nebeneinander einbindet) — bewusst ZWEI getrennte Ein-Serien-Diagramme statt EINES
// gruppierten Zwei-Serien-Diagramms mit gemeinsamer Skala: Kunden-Zahlen liegen pro Woche
// typischerweise 3-5× über den Objekte-Zahlen (live beobachtet), eine gemeinsame Achse würde die
// Objekte-Balken fast unsichtbar neben den Kunden-Balken flachdrücken UND wäre im Kern eine
// Dual-Achsen-Darstellung mit nur einer sichtbaren Skala — genau das Muster, von dem die
// dataviz-Referenz ausdrücklich abrät ("zwei Diagramme ... statt einer Doppelachse"). Jede der
// beiden Karten bekommt stattdessen ihre EIGENE, ehrliche Skala. Innerhalb jedes Balkens jetzt
// gestapelt nach Kategorie (siehe kategorisiere() oben).
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
  verteilungVon,
}: {
  titel: string;
  einheit: string;
  wochen: NeuzugaengeWoche[];
  wert: (woche: NeuzugaengeWoche) => number | null;
  verteilungVon: (woche: NeuzugaengeWoche) => NeuzugaengeVerteilungsEintrag[];
}) {
  // Chronologisch (älteste zuerst) für die Lesrichtung links→rechts — ladeNeuzugaengeVerlauf
  // liefert bewusst neueste zuerst (siehe mitarbeiterstatistik.ts), hier fürs Diagramm umgedreht.
  const chronologisch = [...wochen].reverse();
  const werte = chronologisch.map((w) => wert(w) ?? 0);
  const maxWert = Math.max(1, ...werte);
  const kategorisierung = kategorisiere(chronologisch, verteilungVon);

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
          const yOben = OBEN_PADDING + (PLOT_HOEHE - balkenhoehe);
          // Kurzform des Datums für die Achsenbeschriftung — woche.label trägt zusätzlich das
          // Enddatum und ggf. "(laufend)" (siehe NeuzugaengeWoche in types/index.ts), hier reicht
          // das Startdatum; "laufend" wird stattdessen über reduzierte Deckkraft + "*" codiert.
          const kurzDatum = woche.label.split("–")[0];
          const stapel = stapelFuerWoche(woche, verteilungVon, kategorisierung);

          // Segmente von UNTEN nach OBEN in fixer Kategorie-Reihenfolge (gleiche Reihenfolge wie
          // die Legende) — rückwärts durchlaufen, damit y mit jedem Segment nach oben wandert.
          let yLaufend = OBEN_PADDING + PLOT_HOEHE;
          const segmente = [...kategorisierung.kategorien].reverse().map((kat) => {
            const anzahl = stapel.get(kat.label) ?? 0;
            const segmenthoehe = maxWert === 0 ? 0 : (anzahl / maxWert) * PLOT_HOEHE;
            const y = yLaufend - segmenthoehe;
            yLaufend = y;
            return { key: kat.label, farbKlasse: kat.farbKlasse, y, hoehe: segmenthoehe };
          });

          return (
            <g key={woche.von}>
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
                    className={s.farbKlasse}
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
        {einheit} je Kalenderwoche · * aktuelle Woche, noch nicht abgeschlossen
      </p>
      <Legende kategorien={kategorisierung.kategorien} />
    </div>
  );
}

// "Neuzugänge"-Baustein der Übersicht (siehe Uebersicht.tsx) — zwei Balkendiagramme (Objekte/
// Kunden) nebeneinander, je Kalenderwoche der letzten `verlauf.length` Wochen. Ersetzt die
// frühere eigene "Neuzugänge"-Navi-Seite mit Text-Balken (siehe adminNav.ts) — Oktober 2026
// Chat-Vorgabe wollte die Statistik-Seite als EINEN auf-einen-Blick-lesbaren TV-Dashboard-
// Landingscreen mit echten Diagrammen statt eines weiteren Klickschritts. Balken seit der
// Status2-/Herkunft-Aufschlüsselung (Nutzer-Vorgabe: "Neue Objekte = Status 2 anzeigen, Neue
// Adressen = Herkunft Kontakt, jeweils mit Legende") gestapelt statt einfarbig.
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
        verteilungVon={(w) => w.neueObjekteVerteilung}
      />
      <Balkendiagramm
        titel="Neue Kunden"
        einheit="Kunden"
        wochen={verlauf}
        wert={(w) => w.neueKunden}
        verteilungVon={(w) => w.neueKundenVerteilung}
      />
    </div>
  );
}
