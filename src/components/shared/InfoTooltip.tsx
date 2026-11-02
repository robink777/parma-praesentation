"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";

// Kleines (i)-Hover-Symbol für statistische Werte im Admin-Bereich (Nutzer-Vorgabe Oktober 2026:
// "bei jedem statistischen Wert ... eine kleine Infobox oder so ein kleines (i) wo man drüber
// hovern kann ... nicht im TV- oder Smartphone-Bereich"). Sichtbarkeit weiterhin reines CSS-Hover
// (Tailwind group/info-Muster) mit `focus-within` für Tastaturbedienung — nur die HORIZONTALE
// Position wird jetzt per JS an den tatsächlich verfügbaren Platz angepasst (siehe
// aktualisierePosition unten), kein Klick nötig.
//
// Korrektur nach erstem Entwurf: "die Platzierung passt mir gar nicht ... Die OnOffice-Felder
// gerne prominent wie Labels bei Gmail, darunter dann der Erklärungstext". Deshalb zwei getrennte
// Props statt eines einzelnen Fließtexts: `felder` (als Pillen oben) und `text` (Formel/Logik
// darunter). Auslöser ist das "info"-Icon (siehe Icon.tsx), inline im Zeilenfluss platziert.
//
// DRITTE Korrektur (November 2026, Nutzer-Screenshot: "die infobox ist nich lesbar" — Box der
// letzten KPI-Spalte lief über den rechten Bildschirmrand hinaus): Die bisherigen ZWEI Korrekturen
// (siehe Git-Historie) probierten jeweils eine feste Öffnungsrichtung per CSS — "oben rechts" löste
// die linke Randkollision, kollidierte dafür mit der Navi-Leiste oben; "unten rechts" löste das,
// überschritt dafür bei der LETZTEN Spalte eines responsiven Grids den rechten Rand. Eine einzelne
// feste CSS-Richtung kann das grundsätzlich nicht für JEDE Spaltenposition gleichzeitig lösen.
// Deshalb jetzt dynamisch: Beim Hover/Fokus wird die tatsächliche Position des Auslösers per
// getBoundingClientRect() gemessen und die Box als `position: fixed` so platziert, dass sie nie
// über den rechten (oder linken) Viewport-Rand hinausragt — unabhängig davon, in welcher Spalte
// das (i) gerade sitzt.
const RAND_ABSTAND_PX = 12;

export function InfoTooltip({
  felder,
  text,
  className = "",
  breit = false,
}: {
  felder: string[];
  text: string;
  className?: string;
  // Für Tooltips mit mehreren gebündelten Erklärungen (siehe MitarbeiterBereich.tsx: EIN (i) pro
  // Kachel über alle dort sichtbaren Kennzahlen) — etwas mehr Breite für den längeren Text.
  breit?: boolean;
}) {
  const auslöserRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const breiteNum = breit ? 320 : 280;

  function aktualisierePosition() {
    const rect = auslöserRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxLeft = window.innerWidth - breiteNum - RAND_ABSTAND_PX;
    const left = Math.max(RAND_ABSTAND_PX, Math.min(rect.left - 6, maxLeft));
    setPosition({ top: rect.bottom + 8, left });
  }

  return (
    <span className={`group/info relative inline-flex shrink-0 translate-y-[1px] ${className}`}>
      <button
        ref={auslöserRef}
        type="button"
        onMouseEnter={aktualisierePosition}
        onFocus={aktualisierePosition}
        className="flex items-center justify-center rounded-full text-anthrazit/35 outline-none transition-colors hover:text-messing focus-visible:text-messing"
        aria-label="Erläuterung anzeigen"
      >
        <Icon name="info" size={15} />
      </button>
      <span
        role="tooltip"
        style={position ? { top: position.top, left: position.left, width: breiteNum } : undefined}
        className={`pointer-events-none fixed z-30 origin-top scale-95 rounded-md bg-anthrazit p-sm text-left opacity-0 shadow-lg transition-all duration-100 group-hover/info:scale-100 group-hover/info:opacity-100 group-focus-within/info:scale-100 group-focus-within/info:opacity-100`}
      >
        {felder.length > 0 && (
          <span className="mb-xs flex flex-wrap gap-[5px]">
            {felder.map((feld) => (
              <span
                key={feld}
                className="rounded-full bg-messing px-[8px] py-[3px] font-mono text-[11px] font-semibold text-tinte"
              >
                {feld}
              </span>
            ))}
          </span>
        )}
        <span className="block whitespace-pre-line text-[12px] font-normal leading-relaxed text-reinweiss">
          {text}
        </span>
      </span>
    </span>
  );
}
