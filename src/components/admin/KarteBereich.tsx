import { Objektkarte } from "./Objektkarte";
import { PlzObjekte } from "./PlzObjekte";
import { ObjektkarteDaten } from "@/types";

// Navi-Punkt "Karte" (siehe adminNav.ts) — Chat-Vorgabe Oktober 2026: "Den Kartenbereich hätte
// ich gerne in 3/4 des Bildes ... und die PLZ Navi ... bei Karten in die ganz rechte 1/4 des
// Bildes legen". Gleiche Kachel-Optik wie Uebersicht.tsx (Reinweiss-Fläche, rounded-lg, dezenter
// Schatten) statt der vormals vollflächigen, rahmenlosen Karte (siehe Git-Historie
// KartenAnsicht.tsx) — "den ersten Bereich Übersicht finde ich richtig geil, den Kartenbereich
// hätte ich gerne genau so".
//
// gewaehltePlz/onPlzKlick kommen von AdminDashboard.tsx (dort auch für den PLZ-Deep-Link
// gebraucht) statt hier lokal gehalten zu werden — ausgewaehltePlz geht zusätzlich an
// Objektkarte selbst, damit Flächen-Hervorhebung UND Objekt-Pins exakt zur rechts gezeigten Liste
// passen (vormals ungenutzt, weil Karte und PLZ-Liste auf getrennten Routen lebten).
export function KarteBereich({
  daten,
  gewaehltePlz,
  onPlzKlick,
}: {
  daten?: ObjektkarteDaten;
  gewaehltePlz: { plz: string; ort: string } | null;
  onPlzKlick: (plz: string, ort: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 gap-sm">
      <div className="relative h-full min-h-0 w-3/4 overflow-hidden rounded-lg bg-reinweiss shadow-[0_1px_4px_rgba(80,63,61,0.08)]">
        <Objektkarte daten={daten} onPlzKlick={onPlzKlick} ausgewaehltePlz={gewaehltePlz?.plz ?? null} />
      </div>
      <div className="h-full min-h-0 w-1/4 overflow-y-auto rounded-lg bg-reinweiss p-sm shadow-[0_1px_4px_rgba(80,63,61,0.08)] md:p-md">
        <PlzObjekte plz={gewaehltePlz?.plz ?? null} ort={gewaehltePlz?.ort ?? null} daten={daten} />
      </div>
    </div>
  );
}
