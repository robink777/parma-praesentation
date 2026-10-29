import Image from "next/image";
import { fotoLookup, initialen } from "@/lib/mitarbeiterFotos";
import type { WettkampfEintrag } from "@/lib/onoffice/wettkampf";
import { Betreuer } from "@/types";

// Das "kleine Spiel" für die TV-Vorführung (Oktober 2026 Chat-Vorgabe: "ich will das es ein
// Ranking gibt was optisch gut aussieht. Vielleicht eine Art Pferderennbahn") — jede Zeile ist
// eine Rennbahn, das Profilfoto steht proportional zu den Punkten (relativ zum Spitzenreiter)
// darauf, mit einer Ziellinie am rechten Rand. NUR type-only Import von wettkampf.ts (die echte
// Berechnung läuft serverseitig in app/tv/page.tsx, ladeWettkampfRangliste) — diese Komponente
// selbst bekommt die fertige Rangliste als Props, rein darstellend, kein eigener OnOffice-Zugriff
// (sonst würde der komplette Server-/Auth-Code dieser Client-Komponente mit ins Browser-Bundle
// wandern, siehe TvSlideshow.tsx, "use client").
//
// "repräsentativ"/"immer die richtigen Daten" (Chat-Vorgabe) gilt hier genauso wie bei den
// anderen Folien: dieselbe Rangliste, die auch bei jedem minütlichen Refresh neu berechnet wird.
const zahlenformat = new Intl.NumberFormat("de-DE");
const DATUM_FORMAT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

// Dieselben drei Farben wie die Platzierungs-Badges in der vorherigen Rangliste (Messing/Asche/
// Terrakotta — bereits CI-naher "Gold/Silber/Bronze"-Ersatz, siehe Git-Historie), hier für die
// Bahnmarkierung der ersten drei Plätze.
const RANG_FARBEN = ["border-messing", "border-asche", "border-chart-3"];

function BahnZeile({
  eintrag,
  rang,
  maxPunkte,
  fotoUrl,
}: {
  eintrag: WettkampfEintrag;
  rang: number;
  maxPunkte: number;
  fotoUrl?: string;
}) {
  // Mindestens 6% Bahnlänge, selbst bei 0 Punkten — sonst stünde das Pferd buchstäblich am
  // Startpfosten und wäre kaum von der Bahn-Umrandung zu unterscheiden.
  const prozent = maxPunkte === 0 ? 6 : Math.max(6, (eintrag.punkte / maxPunkte) * 100);
  return (
    <div className="flex h-full min-h-0 items-center gap-sm">
      <span className="w-[1.5ch] shrink-0 text-right font-slab text-lg font-bold text-anthrazit/30">
        {rang}
      </span>
      <div className="relative h-[72%] min-h-[18px] flex-1 overflow-hidden rounded-full bg-stein">
        {/* Zielgerade — rein dekorativ, markiert nur visuell das Bahnende. */}
        <div className="absolute inset-y-0 right-[4%] w-[2px] bg-anthrazit/15" />
        <div
          className="absolute top-1/2 flex h-[135%] -translate-x-1/2 -translate-y-1/2 items-center transition-all duration-700 ease-out"
          style={{ left: `${prozent}%` }}
        >
          <div
            className={`relative aspect-square h-full shrink-0 overflow-hidden rounded-full border-2 bg-reinweiss shadow-[0_2px_6px_rgba(80,63,61,0.3)] ${
              RANG_FARBEN[rang - 1] ?? "border-reinweiss"
            }`}
          >
            {fotoUrl ? (
              <Image src={fotoUrl} alt={eintrag.name} fill className="object-cover" sizes="48px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-slab text-sm font-bold text-walnuss">
                {initialen(eintrag.name)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[clamp(110px,16vw,180px)] shrink-0 text-right">
        <p className="truncate text-body font-medium text-anthrazit">{eintrag.name}</p>
        <p className="font-slab text-lg font-bold text-anthrazit">
          {zahlenformat.format(eintrag.punkte)} <span className="text-small font-normal text-anthrazit/40">Pkt.</span>
        </p>
      </div>
    </div>
  );
}

export function MitarbeiterLeaderboard({
  rangliste,
  alleMitarbeiter,
  saisonBisIso,
}: {
  rangliste: WettkampfEintrag[];
  alleMitarbeiter?: Betreuer[];
  saisonBisIso: string;
}) {
  const fotos = fotoLookup(alleMitarbeiter ?? []);
  const maxPunkte = Math.max(1, ...rangliste.map((e) => e.punkte));
  const saisonBis = new Date(saisonBisIso);
  const heute = new Date();
  const resttage = Math.max(0, Math.ceil((saisonBis.getTime() - heute.getTime()) / 86_400_000));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-reinweiss p-lg shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
      <div className="mb-sm flex shrink-0 items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="label mb-xs">Live-Rangliste</p>
          <h2 className="truncate font-slab text-2xl font-bold text-anthrazit">Wettkampf 2026</h2>
        </div>
        <p className="shrink-0 text-right text-small text-anthrazit/50">
          Saison bis {DATUM_FORMAT.format(saisonBis)} · noch{" "}
          <span className="font-mono font-medium text-anthrazit">{zahlenformat.format(resttage)}</span> Tage
        </p>
      </div>
      {/* Jede Zeile bekommt denselben Anteil (flex-1) der verbleibenden Höhe statt einer festen
          Pixel-/vh-Höhe — bei zehn Teilnehmern passt das sonst nicht in jede Bildschirmgröße:
          "justify-center" bei zu vielen Zeilen ließ den Überlauf live beobachtet symmetrisch
          nach OBEN und unten aus dem Container laufen (überlappte die Überschrift). Mit flex-1
          pro Zeile ist ein Überlauf dagegen unmöglich, die Zeilen werden stattdessen einfach
          schmaler. */}
      <div className="flex min-h-0 flex-1 flex-col gap-[4px]">
        {rangliste.map((eintrag, i) => (
          <div key={eintrag.name} className="min-h-0 flex-1">
            <BahnZeile eintrag={eintrag} rang={i + 1} maxPunkte={maxPunkte} fotoUrl={fotos[eintrag.name]} />
          </div>
        ))}
      </div>
    </div>
  );
}
