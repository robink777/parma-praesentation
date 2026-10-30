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
        className={`pointer-events-none absolute right-[-6px] top-[calc(100%+8px)] z-20 origin-top-right scale-95 rounded-md bg-anthrazit p-sm text-left opacity-0 shadow-lg transition-all duration-100 group-hover/info:scale-100 group-hover/info:opacity-100 group-focus-within/info:scale-100 group-focus-within/info:opacity-100 ${
          breit ? "w-[300px]" : "w-[260px]"
        }`}
      >
        {felder.length > 0 && (
          <span className="mb-xs flex flex-wrap gap-[5px]">
            {felder.map((feld) => (
              <span
                key={feld}
                className="rounded-full bg-messing px-[8px] py-[2px] font-mono text-[10px] font-semibold text-tinte"
              >
                {feld}
              </span>
            ))}
          </span>
        )}
        <span className="block whitespace-pre-line text-[11px] font-normal leading-snug text-reinweiss/90">
          {text}
        </span>
      </span>
    </span>
  );
}
