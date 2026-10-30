import { Icon } from "@/components/icons/Icon";

// Kleines (i)-Hover-Symbol für statistische Werte im Admin-Bereich (Nutzer-Vorgabe Oktober 2026:
// "bei jedem statistischen Wert ... eine kleine Infobox oder so ein kleines (i) wo man drüber
// hovern kann ... nicht im TV- oder Smartphone-Bereich"). Reines CSS-Hover (Tailwind
// group/info-Muster), kein Zustand, kein Klick nötig; `focus-within` zusätzlich für
// Tastaturbedienung.
//
// Korrektur nach erstem Entwurf: "die Platzierung passt mir gar nicht, das (i) bitte optisch
// schöner und besser platziert. Die OnOffice-Felder gerne prominent wie Labels bei Gmail,
// darunter dann der Erklärungstext mit der mathematischen Logik." Deshalb jetzt zwei getrennte
// Props statt eines einzelnen Fließtexts: `felder` (OnOffice-Feldnamen, als eigene Pillen oben im
// Tooltip) und `text` (die Formel/Logik als Fließtext darunter). Der Auslöser selbst ist jetzt das
// echte "info"-Icon (siehe Icon.tsx) statt eines eingekreisten Textzeichens, und wird von den
// Aufrufern INLINE im jeweiligen Zeilenfluss platziert (nicht mehr absolut in der Kachel-Ecke, wo
// es Inhalte überlagern konnte) — nur das Popup selbst bleibt absolut positioniert.
//
// Zweite Korrektur: "das klappt so nicht, mach die Infobox nach oben rechts, die Infobox ist
// nicht leserlich" — das Popup öffnete bis dahin nach UNTEN LINKS (rechtsbündig am Auslöser
// verankert, Box wächst nach links). Für ein (i) nah am linken Bildschirmrand (z.B. die erste
// KPI-Spalte) lief die Box dadurch über den Viewport-Rand hinaus und wurde dort abgeschnitten.
// Ein erster Versuch mit "nach oben rechts" (wie gewünscht) zeigte live im Admin-Bereich sofort
// ein neues Problem: die KPI-Kacheln der ERSTEN Zeile sitzen direkt unter der Navi-Leiste, ohne
// Platz nach oben — die Box wurde dort stattdessen von oben abgeschnitten (sogar noch weniger
// lesbar als zuvor). Deshalb stattdessen nach UNTEN RECHTS geöffnet (linksbündig am Auslöser
// verankert, wächst nach rechts und nach unten): behält den Effekt, der das ursprüngliche Problem
// löste (Platz nach rechts statt nach links, löst die linke Rand-Kollision), vermeidet aber die
// neue Kollision oben, weil unter JEDER Kachel immer Inhalt/Weißraum folgt, nie der Viewport-Rand.
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
  return (
    <span className={`group/info relative inline-flex shrink-0 translate-y-[1px] ${className}`}>
      <button
        type="button"
        className="flex items-center justify-center rounded-full text-anthrazit/35 outline-none transition-colors hover:text-messing focus-visible:text-messing"
        aria-label="Erläuterung anzeigen"
      >
        <Icon name="info" size={15} />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-[-6px] top-[calc(100%+8px)] z-30 origin-top-left scale-95 rounded-md bg-anthrazit p-sm text-left opacity-0 shadow-lg transition-all duration-100 group-hover/info:scale-100 group-hover/info:opacity-100 group-focus-within/info:scale-100 group-focus-within/info:opacity-100 ${
          breit ? "w-[320px]" : "w-[280px]"
        }`}
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
