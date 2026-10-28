import { Card } from "@/components/layout/SectionShell";
import { NeuzugaengeWoche } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Leadquellen.tsx/Kontrolle.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Eine Wochenzeile im Neuzugänge-Verlauf — zwei Balken (Objekte/Kunden) je Woche, JEWEILS auf
// die eigene Spitze skaliert (maxObjekte/maxKunden statt eines gemeinsamen Maximums), damit der
// Wochen-zu-Woche-TREND innerhalb jeder Kennzahl erkennbar bleibt (Chat-Vorgabe: "wieviele ... in
// einer Woche angelegt worden sind") — ein gemeinsames Maximum würde die regelmäßig deutlich
// kleineren Objekte-Balken neben den Kunden-Balken fast unsichtbar machen. Gleiches
// Balken-Muster wie HerkunftZeile in Leadquellen.tsx. Walnuss (Objekte) + Asche (Kunden) statt
// Messing für die zweite Farbe — Messing darf laut CI höchstens 1× pro Sichtbereich auftauchen
// und ist in der Objektkarte/PLZ-Legende bereits vergeben (siehe KATEGORIE_FARBE in
// PlzObjekte.tsx).
function WochenZeile({
  woche,
  maxObjekte,
  maxKunden,
}: {
  woche: NeuzugaengeWoche;
  maxObjekte: number;
  maxKunden: number;
}) {
  const breite = (wert: number | null, max: number) =>
    wert === null || max === 0 ? 0 : Math.max(4, Math.round((wert / max) * 100));

  return (
    <div className="border-b border-anthrazit/5 py-xs last:border-b-0">
      <p className="mb-[4px] text-small font-medium text-anthrazit">{woche.label}</p>
      <div className="flex items-center gap-xs py-[1px]">
        <span className="w-[50px] shrink-0 text-small text-anthrazit/60">Objekte</span>
        <div className="h-[8px] flex-1 overflow-hidden rounded-sm bg-stein">
          <div
            className="h-full rounded-sm bg-walnuss"
            style={{ width: `${breite(woche.neueObjekte, maxObjekte)}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right font-mono text-small text-anthrazit/70">
          {woche.neueObjekte === null ? "–" : zahlenformat.format(woche.neueObjekte)}
        </span>
      </div>
      <div className="flex items-center gap-xs py-[1px]">
        <span className="w-[50px] shrink-0 text-small text-anthrazit/60">Kunden</span>
        <div className="h-[8px] flex-1 overflow-hidden rounded-sm bg-stein">
          <div
            className="h-full rounded-sm bg-asche"
            style={{ width: `${breite(woche.neueKunden, maxKunden)}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right font-mono text-small text-anthrazit/70">
          {woche.neueKunden === null ? "–" : zahlenformat.format(woche.neueKunden)}
        </span>
      </div>
    </div>
  );
}

// "Neuzugänge"-Seite im Admin-Bereich: wie viele Objekte und Kunden je Kalenderwoche neu in
// OnOffice angelegt wurden (siehe ladeNeuzugaengeVerlauf in onoffice/mitarbeiterstatistik.ts) —
// Oktober 2026 Chat-Vorgabe: ursprünglich zwei Kacheln auf "Auf einen Blick" (rollierende 7
// Tage), auf Nutzerwunsch durch einen "eigenen Reiter mit mehr Verlauf (z.B. Wochen-Trend,
// letzte 4-8 Wochen)" ersetzt. undefined (statt eines leeren Arrays) bedeutet "Live-Abruf
// fehlgeschlagen" (siehe app/admin/page.tsx), analog zum Muster bei Kontrolle/Leadquellen.
export function Neuzugaenge({ verlauf }: { verlauf?: NeuzugaengeWoche[] }) {
  if (verlauf === undefined) {
    return (
      <Card compact className="text-center">
        <p className="text-small text-anthrazit/50">
          Neuzugänge konnten nicht geladen werden.
        </p>
      </Card>
    );
  }

  const maxObjekte = Math.max(0, ...verlauf.map((w) => w.neueObjekte ?? 0));
  const maxKunden = Math.max(0, ...verlauf.map((w) => w.neueKunden ?? 0));

  return (
    <>
      <p className="mb-xs max-w-[65ch] text-small text-anthrazit/60">
        Neu in OnOffice angelegte Objekte und Kunden je Kalenderwoche, die letzten{" "}
        {verlauf.length} Wochen.
      </p>
      <Card compact>
        <div className="flex flex-col">
          {verlauf.map((woche) => (
            <WochenZeile
              key={woche.von}
              woche={woche}
              maxObjekte={maxObjekte}
              maxKunden={maxKunden}
            />
          ))}
        </div>
      </Card>
    </>
  );
}
