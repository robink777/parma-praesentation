import Image from "next/image";
import { fotoLookup, initialen } from "@/lib/mitarbeiterFotos";
import type { WettkampfEintrag, WettkampfKategorie } from "@/lib/onoffice/wettkampf";
import { Betreuer, MitarbeiterKennzahlen } from "@/types";

// "Mitarbeiter"-Folie der TV-Vorführung — Oktober 2026 Chat-Vorgabe-Korrektur: "Die Kacheln sind
// super! Den restlichen Platz kannst du für die Darstellung des Gewinnspiels nutzen. Bauen wir
// es lieber als Diagramm, y-Achse die Aktivitäten, x-Achse die Mitarbeiter. Für die Mitarbeiter
// reicht das Kürzel, keine Bilder. Die Balken kannst du aufteilen wie bei der Statistik der
// Objekte (farblich in den Balken — wie viele Telefonate, wie viele Termine etc., alles halt was
// Punkte bringt)". Ersetzt das vorherige Pferderennen durch ein gestapeltes Säulendiagramm (nach
// demselben Prinzip wie ObjektBalken im Admin-Vertrieb-Reiter, hier aber EIN Balken pro
// Mitarbeiter statt EIN Balken pro Kategorie).
//
// Zwei Bereiche:
//   1. Säulendiagramm (oben) — eine Säule je Mitarbeiter, Höhe = Gesamtpunktzahl, innen gestapelt
//      nach Punkte-Kategorie (siehe wettkampf.ts, WettkampfSegment). X-Achsen-Beschriftung ist
//      nur das Namenskürzel (initialen()), kein Foto geladen.
//   2. Kachel-Raster (unten) — unverändert aus der vorherigen Korrektur: Foto, Name, Anrufe
//      heute/Woche + Termine heute/Woche, nicht gestreckt (siehe MitarbeiterZahlenKachel).
// Schrift bewusst kleiner als im übrigen Dashboard (Chat-Vorgabe: "die Ausgabe findet überwiegend
// auf einem Fernseher statt ... kannst auch mit den Schriftgrößen ein bisschen kleiner werden").
const zahlenformat = new Intl.NumberFormat("de-DE");

function formatWert(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : zahlenformat.format(n);
}

// Dieselben drei Farben wie zuvor für Platz 1-3 (Messing/Asche/Terrakotta) — Rahmen oben an der
// Kachel.
const RANG_FARBEN = ["border-messing", "border-asche", "border-chart-3"];

// Eine Kachel — bewusst kompakt UND nicht auf die volle verfügbare Höhe gestreckt (kein
// "h-full"/flex-1 auf der Wurzel): Die Kachel ist nur so hoch wie ihr Inhalt braucht, als Raster
// vertikal zentriert in der Restfläche (siehe MitarbeiterLeaderboard unten).
function MitarbeiterZahlenKachel({
  name,
  rang,
  fotoUrl,
  kennzahlen,
  telefonateGesamt,
  termineGesamt,
  geaenderteFelder,
}: {
  name: string;
  rang: number;
  fotoUrl?: string;
  kennzahlen?: MitarbeiterKennzahlen;
  telefonateGesamt: number;
  termineGesamt: number;
  geaenderteFelder?: Set<string>;
}) {
  // Nutzer-Korrektur: "ich brauche bei allen Mitarbeitern ja auch immer die Gesamtzahlen der
  // einzelnen Punkte ... noch etwas safespace ... ergänzen für Anrufe gesamt, Termine gesamt" —
  // dritte Zeile (Saison-Gesamtzahl) unter heute/Woche, je Zeile ein Zeitraum. `feld` je Zeile
  // muss exakt den Schlüsseln von Momentaufnahme (siehe MitarbeiterLeaderboard unten)
  // entsprechen, sonst greift die Änderungs-Markierung nicht.
  const werte: { label: string; wert: string; feld: string }[] = [
    { label: "Anrufe heute", wert: formatWert(kennzahlen?.telefonateHeute), feld: "telefonateHeute" },
    { label: "Termine heute", wert: formatWert(kennzahlen?.termineHeute), feld: "termineHeute" },
    { label: "Anrufe Woche", wert: formatWert(kennzahlen?.telefonateWoche), feld: "telefonateWoche" },
    { label: "Termine Woche", wert: formatWert(kennzahlen?.termineWoche), feld: "termineWoche" },
    { label: "Anrufe gesamt", wert: formatWert(telefonateGesamt), feld: "telefonateGesamt" },
    { label: "Termine gesamt", wert: formatWert(termineGesamt), feld: "termineGesamt" },
  ];
  const rangFarbe = RANG_FARBEN[rang - 1];
  // Nutzer-Vorgabe: "ein kleines Leuchten der Mitarbeiterkachel (vielleicht Schlagschatten mit
  // Akzentfarbe mit 20% Deckkraft)", solange mindestens ein Wert dieser Kachel sich seit dem
  // letzten Ladezyklus verändert hat. Erst auf 0,6/32px/10px verstärkt ("viel deutlicher"), dann
  // auf Nutzerwunsch ("ok etwas weniger") wieder etwas zurückgenommen auf 0,4/26px/8px.
  const hatAenderung = (geaenderteFelder?.size ?? 0) > 0;
  return (
    <div
      className={`relative rounded-md border-t-2 bg-reinweiss px-sm py-xs transition-shadow ${
        hatAenderung
          ? "shadow-[0_1px_4px_rgba(80,63,61,0.08),0_0_26px_8px_rgba(203,142,73,0.4)]"
          : "shadow-[0_1px_4px_rgba(80,63,61,0.08)]"
      } ${rangFarbe ?? "border-t-transparent"}`}
    >
      <span className="absolute right-[6px] top-[4px] font-mono text-[10px] text-anthrazit/25">
        #{rang}
      </span>
      <div className="mb-xs flex items-center gap-xs">
        <div className="relative h-[clamp(20px,3.6vh,30px)] w-[clamp(20px,3.6vh,30px)] shrink-0 overflow-hidden rounded-full bg-sand">
          {fotoUrl ? (
            <Image src={fotoUrl} alt={name} fill className="object-cover" sizes="30px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-slab text-[9px] font-bold text-walnuss">
              {initialen(name)}
            </div>
          )}
        </div>
        <p className="min-w-0 truncate text-small font-medium leading-tight text-anthrazit">{name}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-sm gap-y-xs">
        {werte.map((w) => (
          <div key={w.label} className="min-w-0">
            <p className="truncate font-mono text-[8px] font-medium uppercase leading-tight text-anthrazit/45">
              {w.label}
            </p>
            <p
              className={`truncate font-slab text-[clamp(13px,2.2vh,18px)] font-bold leading-tight text-anthrazit ${
                geaenderteFelder?.has(w.feld) ? "tv-wert-aktualisiert" : ""
              }`}
            >
              {w.wert}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Feste Reihenfolge/Farben je Punkte-Kategorie (dataviz-Prinzip: Kategorialfarben nie zur
// Laufzeit neu zugewiesen) — sechs unterscheidbare Töne aus der bereits validierten chart-Palette
// (siehe tailwind.config.ts), hier frei von der Bedeutung, die dieselben Töne z.B. in
// Uebersicht.tsx tragen (dort Objekt-Status, hier Aktivitätsart — zwei verschiedene Dimensionen).
const SEGMENT_REIHENFOLGE: WettkampfKategorie[] = [
  "telefonate",
  "besichtigungen",
  "akquiseTermine",
  "finanzierungTermine",
  "auftraege",
  "verkaeufe",
];

const SEGMENT_FARBEN: Record<WettkampfKategorie, string> = {
  telefonate: "bg-chart-2",
  besichtigungen: "bg-chart-5",
  akquiseTermine: "bg-chart-4",
  finanzierungTermine: "bg-chart-8",
  auftraege: "bg-chart-7",
  verkaeufe: "bg-chart-1",
};

const SEGMENT_LABEL: Record<WettkampfKategorie, string> = {
  telefonate: "Telefonate",
  besichtigungen: "Besichtigungen",
  akquiseTermine: "Akquise-Termine",
  finanzierungTermine: "Finanzierungs-Termine",
  auftraege: "Aufträge",
  verkaeufe: "Verkäufe",
};

// Nutzer-Korrektur: "schreib bitte in die Legende noch welche Aktivität wieviele Punkte bringt" —
// Werte bewusst hier als Text dupliziert statt PUNKTE aus wettkampf.ts zu importieren: Das wäre
// ein Wert-Import aus einem Modul, das serverseitigen OnOffice-Code lädt, und würde diesen Code
// in den Client-Bundle dieser Folie ziehen (siehe TvSlideshow.tsx-Kommentar). Bei einer Änderung
// an PUNKTE in wettkampf.ts muss dieser Text von Hand mitgezogen werden.
const SEGMENT_PUNKTE_TEXT: Record<WettkampfKategorie, string> = {
  telefonate: "1 Pkt.",
  besichtigungen: "3 Pkt.",
  akquiseTermine: "6/7 Pkt.",
  finanzierungTermine: "6/7 Pkt.",
  auftraege: "10 Pkt.",
  verkaeufe: "10 Pkt.",
};

function SegmentLegende() {
  return (
    <div className="flex flex-wrap items-center gap-x-sm gap-y-[2px]">
      {SEGMENT_REIHENFOLGE.map((kat) => (
        <span key={kat} className="flex items-center gap-[3px] text-[9px] text-anthrazit/50">
          <span className={`inline-block h-[7px] w-[7px] rounded-full ${SEGMENT_FARBEN[kat]}`} />
          {SEGMENT_LABEL[kat]} ({SEGMENT_PUNKTE_TEXT[kat]})
        </span>
      ))}
    </div>
  );
}

// Eine Säule — Gesamthöhe proportional zur Punktzahl relativ zum Spitzenreiter, innen gestapelt
// nach Kategorie (gleiches Prinzip wie ObjektBalken im Admin-Vertrieb-Reiter, hier aber die
// Säule EINER Person statt eines Balkens mit mehreren Kategorien nebeneinander). Kein Foto
// (Chat-Vorgabe: "für die Mitarbeiter musst du nicht die Bilder laden, hier reicht einfach das
// Kürzel") — nur initialen() als X-Achsen-Beschriftung.
function AktivitaetenSaeule({ eintrag, maxPunkte }: { eintrag: WettkampfEintrag; maxPunkte: number }) {
  const hoeheProzent = maxPunkte === 0 ? 2 : Math.max(2, (eintrag.punkte / maxPunkte) * 100);
  const gesamtFuerAnteile = eintrag.punkte || 1;
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center">
      <span className="mb-[2px] shrink-0 font-mono text-[9px] font-semibold text-anthrazit">
        {zahlenformat.format(eintrag.punkte)}
      </span>
      <div className="flex min-h-0 w-full flex-1 items-end">
        <div
          className="flex w-full flex-col-reverse overflow-hidden rounded-t-[3px]"
          style={{ height: `${hoeheProzent}%` }}
        >
          {eintrag.segmente
            .filter((s) => s.punkte > 0)
            .map((s) => (
              <div
                key={s.kategorie}
                className={SEGMENT_FARBEN[s.kategorie]}
                style={{ height: `${(s.punkte / gesamtFuerAnteile) * 100}%` }}
                title={`${SEGMENT_LABEL[s.kategorie]}: ${zahlenformat.format(s.punkte)} Pkt.`}
              />
            ))}
        </div>
      </div>
      <span className="mt-[3px] shrink-0 font-mono text-[10px] font-bold text-anthrazit/70">
        {initialen(eintrag.name)}
      </span>
    </div>
  );
}

export function MitarbeiterLeaderboard({
  kennzahlen,
  rangliste,
  alleMitarbeiter,
  saisonBisIso,
  veraenderteFelder,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  rangliste: WettkampfEintrag[];
  alleMitarbeiter?: Betreuer[];
  saisonBisIso: string;
  // Welche Kachel-Felder sich seit dem letzten Ladezyklus je Mitarbeiter verändert haben (Nutzer-
  // Vorgabe: "wenn ein Mitarbeiter aktiv ist und eine Aktivität speichert, ein optisches Feedback
  // ... Leuchten der Kachel ... Wert der sich verändert hat pulsierend"). Wird in TvSlideshow.tsx
  // berechnet statt hier: Diese Folie wird beim Folienwechsel aus- und wieder eingehängt (siehe
  // {slide === "mitarbeiter" && ...}), ein hier gehaltener Vergleichs-State ginge bei jedem
  // Wechsel verloren — TvSlideshow bleibt dagegen durchgehend gemountet.
  veraenderteFelder?: Record<string, Set<string>>;
}) {
  const fotos = fotoLookup(alleMitarbeiter ?? []);
  const maxPunkte = Math.max(1, ...rangliste.map((e) => e.punkte));
  const saisonBis = new Date(saisonBisIso);
  const heute = new Date();
  const resttage = Math.max(0, Math.ceil((saisonBis.getTime() - heute.getTime()) / 86_400_000));
  const spalten = rangliste.length >= 8 ? "grid-cols-5" : rangliste.length >= 4 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="flex h-full min-h-0 flex-col gap-sm">
      {/* Säulendiagramm — der jetzt prominentere, obere Bereich (Nutzer-Korrektur: "den
          restlichen Platz kannst du für die Darstellung des Gewinnspiels nutzen"). Eigene Höhe
          über clamp() statt eines Flex-Anteils der Restfläche, damit sie bei hohen Viewports
          nicht unkontrolliert wächst. */}
      <div className="flex h-[clamp(160px,30vh,280px)] shrink-0 flex-col gap-xs rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
        <div className="flex shrink-0 items-center justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-anthrazit/45">
            Wettkampf-Punkte
          </p>
          <p className="font-mono text-[10px] text-anthrazit/45">
            Saison bis {saisonBis.toLocaleDateString("de-DE")} · noch {zahlenformat.format(resttage)} Tage
          </p>
        </div>
        <div className="shrink-0">
          <SegmentLegende />
        </div>
        <div className="flex min-h-0 flex-1 items-end gap-xs border-t border-anthrazit/5 pt-xs">
          {rangliste.map((eintrag) => (
            <AktivitaetenSaeule key={eintrag.name} eintrag={eintrag} maxPunkte={maxPunkte} />
          ))}
        </div>
      </div>
      {/* Kacheln — kompakt, in der verbleibenden Fläche vertikal zentriert statt gestreckt. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div className={`grid ${spalten} gap-xs`}>
          {rangliste.map((eintrag, i) => (
            <MitarbeiterZahlenKachel
              key={eintrag.name}
              name={eintrag.name}
              rang={i + 1}
              fotoUrl={fotos[eintrag.name]}
              kennzahlen={kennzahlen?.[eintrag.name]}
              telefonateGesamt={eintrag.telefonateGesamt}
              termineGesamt={eintrag.termineGesamt}
              geaenderteFelder={veraenderteFelder?.[eintrag.name]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
