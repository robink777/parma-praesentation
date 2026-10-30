// Kleines "(i)"-Hinweiszeichen mit Hover-Tooltip für statistische Werte im Admin-Bereich (Nutzer-
// Vorgabe Oktober 2026: "ich hätte gerne dass bei jedem statistischen Wert ... eine kleine
// Infobox oder so ein kleines (i) wo man drüber hovern kann. Ich will bei jedem Wert wissen,
// welche OnOffice-Felder und welche Formeln dahinterstecken ... nicht im TV- oder Smartphone-
// Bereich"). Reines CSS-Hover (Tailwind group/peer-Muster über `group/info`), kein Zustand, kein
// Klick nötig — genau "drüber hovern" wie vom Nutzer verlangt; `focus-within` zusätzlich für
// Tastaturbedienung (Tab + Fokus statt Hover).
//
// Jede einbindende Stelle entscheidet SELBST, ob sie das hier überhaupt rendert — keine eigene
// "nur im Admin"-Logik in dieser Datei. Die beiden mit der TV-/Smartphone-Ansicht geteilten
// Komponenten (components/shared/KpiKachel.tsx, components/admin/Neuzugaenge.tsx) blenden es über
// ihre vorhandene `interaktiv`/`zeigeInfo`-Weiche aus; alle anderen Admin-Komponenten
// (MitarbeiterBereich/Leadquellen/Objektkarte/Kontrolle) binden es direkt ein, weil sie ohnehin
// nie auf der TV-/Smartphone-Route laufen.
export function InfoTooltip({
  text,
  className = "",
  breit = false,
}: {
  text: string;
  className?: string;
  // Für Kacheln mit mehreren Kennzahlen (siehe MitarbeiterBereich.tsx) bündelt EIN (i) die
  // Erläuterung aller sichtbaren Werte der Kachel statt eines Icons pro Einzelwert (sonst 4-6
  // (i)-Symbole auf derselben Kachel) — "breit" gibt dem mehrzeiligen Text (whitespace-pre-line,
  // Absätze per "\n\n") entsprechend mehr Platz.
  breit?: boolean;
}) {
  return (
    <span className={`group/info relative inline-flex shrink-0 ${className}`}>
      <button
        type="button"
        className="flex h-[16px] w-[16px] items-center justify-center rounded-full border border-anthrazit/25 font-mono text-[10px] font-semibold normal-case text-anthrazit/40 outline-none transition-colors hover:border-anthrazit/50 hover:text-anthrazit/70 focus-visible:border-anthrazit/50 focus-visible:text-anthrazit/70"
        aria-label="Erläuterung anzeigen"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute right-0 top-[calc(100%+6px)] z-20 origin-top-right scale-95 whitespace-pre-line rounded-md bg-anthrazit px-sm py-xs text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-reinweiss opacity-0 shadow-lg transition-all duration-100 group-hover/info:scale-100 group-hover/info:opacity-100 group-focus-within/info:scale-100 group-focus-within/info:opacity-100 ${
          breit ? "w-[300px]" : "w-[260px]"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
