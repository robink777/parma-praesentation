import Image from "next/image";
import { fotoLookup, initialen } from "@/lib/mitarbeiterFotos";
import type { WettkampfEintrag } from "@/lib/onoffice/wettkampf";
import { Betreuer, MitarbeiterKennzahlen } from "@/types";

// "Mitarbeiter"-Folie der TV-Vorführung — Oktober 2026 Chat-Vorgabe-Korrektur: "Ich hätte gerne,
// dass du das Board genauso gestaltest wie das Übersichtsboard, und zwar mit diesen Kacheln ...
// die Mitarbeiter müssen genau sehen, wie viele Anrufe am Tag, wie viel in der Woche ... Das
// Pferderennen kannst du deutlich kleiner darstellen". Zwei Bereiche statt der vorherigen,
// bildschirmfüllenden Pferderennbahn:
//   1. Kachel-Raster (Hauptfläche) — dieselbe Kachel-Optik wie Uebersicht.tsx/der frühere
//      Admin-Vertrieb-Reiter: Foto, Name, dann Anrufe heute/Woche + Termine heute/Woche als
//      echte Zahlen. Grundlage: dieselben kennzahlen (MitarbeiterKennzahlen je Person), die auch
//      der Admin-Bereich zeigt — EXAKT dieselben Live-Zahlen, keine eigene Berechnung.
//   2. Pferderennen-Streifen (klein, unten) — die Wettkampf-Rangliste (Punkte über die ganze
//      Saison, siehe wettkampf.ts) bleibt als kompakte Zusatz-Ansicht erhalten, nur sehr viel
//      kleiner als zuvor.
// Schrift bewusst kleiner als im übrigen Dashboard (Chat-Vorgabe: "die Ausgabe findet überwiegend
// auf einem Fernseher statt ... kannst auch mit den Schriftgrößen ein bisschen kleiner werden") —
// ein Fernseher wird aus der Nähe betrachtet (Mitarbeiter, die kurz hinschauen), nicht wie die
// übrigen Folien primär aus Raumdistanz.
const zahlenformat = new Intl.NumberFormat("de-DE");

function formatWert(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : zahlenformat.format(n);
}

// Dieselben drei Farben wie zuvor für Platz 1-3 (Messing/Asche/Terrakotta) — jetzt als dezenter
// Rahmen oben an der Kachel statt (wie zuvor) am Avatar in der Bahn.
const RANG_FARBEN = ["border-messing", "border-asche", "border-chart-3"];

// Eine Kachel — bewusst kompakt (kleinere Schrift/Abstände/Avatar, siehe Dateikommentar oben)
// UND bewusst NICHT auf die volle verfügbare Höhe gestreckt (kein "h-full"/flex-1 mehr auf der
// Wurzel): Nutzer-Korrektur Oktober 2026: "jetzt haben wir ganz viel weiße Fläche in den
// einzelnen Kacheln ... die Kacheln kannst du in der Höhe kürzen" — die Kachel ist jetzt nur so
// hoch wie ihr Inhalt braucht, der frei werdende Platz geht ans (jetzt prominentere)
// Pferderennen oben.
function MitarbeiterZahlenKachel({
  name,
  rang,
  fotoUrl,
  kennzahlen,
}: {
  name: string;
  rang: number;
  fotoUrl?: string;
  kennzahlen?: MitarbeiterKennzahlen;
}) {
  const werte = [
    { label: "Anrufe heute", wert: formatWert(kennzahlen?.telefonateHeute) },
    { label: "Anrufe Woche", wert: formatWert(kennzahlen?.telefonateWoche) },
    { label: "Termine heute", wert: formatWert(kennzahlen?.termineHeute) },
    { label: "Termine Woche", wert: formatWert(kennzahlen?.termineWoche) },
  ];
  const rangFarbe = RANG_FARBEN[rang - 1];
  return (
    <div
      className={`relative rounded-md border-t-2 bg-reinweiss px-sm py-xs shadow-[0_1px_4px_rgba(80,63,61,0.08)] ${
        rangFarbe ?? "border-t-transparent"
      }`}
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
            <p className="truncate font-slab text-[clamp(13px,2.2vh,18px)] font-bold leading-tight text-anthrazit">
              {w.wert}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Eine Bahn im jetzt prominenteren Pferderennen oben (Nutzer-Korrektur: "Dafür das Pferderennen
// etwas prominenter über die Kacheln, so dass es gut erkennbar ist") — nur Position + Foto, der
// Name/die Punktzahl stehen bereits in der Kachel darunter, hier bewusst keine Wiederholung
// ("gut erkennbar" löst sich über das größere Foto selbst, nicht über zusätzlichen Text).
function Bahn({ eintrag, maxPunkte, fotoUrl }: { eintrag: WettkampfEintrag; maxPunkte: number; fotoUrl?: string }) {
  const prozent = maxPunkte === 0 ? 4 : Math.max(4, (eintrag.punkte / maxPunkte) * 100);
  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden rounded-full bg-stein">
      <div className="absolute inset-y-0 right-[3%] w-[2px] bg-anthrazit/15" />
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
        style={{ left: `${prozent}%` }}
      >
        {/* FESTE Größe statt an die Bahnhöhe gekoppelt ("h-full"/"aspect-square") — Letzteres
            verzerrte die Fotos bei den jetzt deutlich höheren Bahnen zu hohen Ovalen und ließ
            benachbarte Bahnen überlappen (Avatar wurde über die Bahnbreite hinaus breit). */}
        <div className="relative h-[clamp(36px,6vh,56px)] w-[clamp(36px,6vh,56px)] overflow-hidden rounded-full border-2 border-reinweiss bg-reinweiss shadow-[0_1px_4px_rgba(80,63,61,0.35)]">
          {fotoUrl ? (
            <Image src={fotoUrl} alt={eintrag.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-slab text-[11px] font-bold text-walnuss">
              {initialen(eintrag.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MitarbeiterLeaderboard({
  kennzahlen,
  rangliste,
  alleMitarbeiter,
  saisonBisIso,
}: {
  kennzahlen?: Record<string, MitarbeiterKennzahlen>;
  rangliste: WettkampfEintrag[];
  alleMitarbeiter?: Betreuer[];
  saisonBisIso: string;
}) {
  const fotos = fotoLookup(alleMitarbeiter ?? []);
  const maxPunkte = Math.max(1, ...rangliste.map((e) => e.punkte));
  const saisonBis = new Date(saisonBisIso);
  const heute = new Date();
  const resttage = Math.max(0, Math.ceil((saisonBis.getTime() - heute.getTime()) / 86_400_000));
  const spalten = rangliste.length >= 8 ? "grid-cols-5" : rangliste.length >= 4 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="flex h-full min-h-0 flex-col gap-sm">
      {/* Pferderennen — jetzt der prominentere, obere Bereich (Nutzer-Korrektur: "das
          Pferderennen etwas prominenter über die Kacheln, so dass es gut erkennbar ist").
          Eigene Höhe über clamp() statt eines Flex-Anteils der Restfläche — ein Flex-Anteil
          machte die Bahn bei hohen Viewports unkontrolliert riesig und verzerrte die Avatare
          (siehe Bahn-Komponente). */}
      <div className="flex h-[clamp(90px,16vh,150px)] shrink-0 flex-col gap-xs rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
        <div className="flex shrink-0 items-center justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-anthrazit/45">
            Wettkampf-Rangliste
          </p>
          <p className="font-mono text-[10px] text-anthrazit/45">
            Saison bis {saisonBis.toLocaleDateString("de-DE")} · noch {zahlenformat.format(resttage)} Tage
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-center gap-xs">
          {rangliste.map((eintrag) => (
            <Bahn key={eintrag.name} eintrag={eintrag} maxPunkte={maxPunkte} fotoUrl={fotos[eintrag.name]} />
          ))}
        </div>
      </div>
      {/* Kacheln — kompakt, in der verbleibenden Fläche vertikal zentriert statt gestreckt
          (siehe MitarbeiterZahlenKachel, "weiße Fläche"-Korrektur). */}
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div className={`grid ${spalten} gap-xs`}>
          {rangliste.map((eintrag, i) => (
            <MitarbeiterZahlenKachel
              key={eintrag.name}
              name={eintrag.name}
              rang={i + 1}
              fotoUrl={fotos[eintrag.name]}
              kennzahlen={kennzahlen?.[eintrag.name]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
