/**
 * ParmaLoader — Marken-Ladeanimation, portiert aus dem Design-Handoff
 * (design_handoff_ladescreen/, siehe README.md dort für Hintergrund/Timeline). Reiner
 * CSS-Loop, kein JS treibt die Animation selbst — der Schlüsselring (.pl-key/.pl-ring) fährt
 * ein, "schließt" ab (rotateX, siehe globals.css für die vollständige Erklärung der Technik),
 * dreht zurück und fährt wieder aus, endlos wiederholend.
 *
 * Die Original-Pfaddaten der Marke (P + Zähne, Schlüsselring) sind unverändert aus dem Handoff
 * übernommen — siehe README.md dort ("high-fidelity", Icon_Hell.svg). Farben sind bewusst NICHT
 * die hartkodierten Hex-Werte aus dem Handoff, sondern auf die bestehenden CI-Tokens
 * (tailwind.config.ts) gemappt: `messing` ist ein exaktes Match für den Messing-Ton des
 * Handoffs; Schlosskörper und Label-Text folgen stattdessen der im übrigen App-Code bereits
 * etablierten Konvention (walnuss für kräftige Marken-/Icon-Flächen, z.B. Avatar-Initialen in
 * Kontaktperson.tsx; anthrazit/60 für gedämpften Fließtext/Labels, z.B. Dokumente.tsx).
 *
 * Nutzung: <ParmaLoader /> (Standard-Label "Wird geladen") oder <ParmaLoader label="..." />
 * für eine eigene Beschriftung, z.B. eine der Ladestationen in app/loading.tsx. Über `size`
 * (Icon-Breite in px, Standard 240) lässt sich eine kompakte Variante rendern — z.B. für den
 * Vorauswahl-Ladezustand INNERHALB eines Reiters statt der vollflächigen Variante in
 * app/loading.tsx (siehe Vergleichswert.tsx) — die SVG skaliert dank viewBox verlustfrei,
 * darunter wird zusätzlich enger gruppiert und die Beschriftung kleiner gesetzt.
 */
export function ParmaLoader({ label = "Wird geladen", size = 240 }: { label?: string; size?: number }) {
  const kompakt = size < 150;
  return (
    <div className={`flex flex-col items-center ${kompakt ? "gap-sm" : "gap-lg"}`}>
      <svg
        className="parma-loader-icon"
        style={{ width: size, height: "auto" }}
        viewBox="0 0 118.67 105.06"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* P + Zähne — Original-Markenvektor, fix (bildet den Schlosskörper) */}
        <g className="fill-walnuss">
          <path d="M97.25,33.81c-2.99-8.06-10.91-13.22-19.51-13.22h-39.44c-.32,0-.57.26-.57.57v3.69c0,.33.27.57.6.57,3.46.01,6.25,2.82,6.25,6.28v5.61h35.77c1.56,0,2.99,1.05,3.28,2.58.4,2.06-1.17,3.86-3.16,3.86h-2.44c-.23,0-.42.19-.42.42v7.88c0,.24-.19.43-.43.43h-2.47c-.24,0-.43-.19-.43-.43v-5.02c0-.23-.19-.42-.42-.42h-1.95c-.23,0-.42.19-.42.42v3.05c0,.24-.19.43-.43.43h-2.47c-.24,0-.43-.19-.43-.43v-3.05c0-.23-.19-.42-.42-.42h-1.95c-.23,0-.42.19-.42.42v5.02c0,.24-.19.43-.43.43h-2.47c-.24,0-.43-.19-.43-.43v-7.88c0-.23-.19-.42-.42-.42h-16.99v30.74c0,3.46-2.8,6.27-6.26,6.28-.33,0-.6.24-.6.57v3.4c0,.61.26.87.57.87h29.89c.32,0,.57-.26.57-.57v-3.69c0-.33-.27-.57-.6-.57-3.46-.01-6.25-2.82-6.25-6.28v-10.23c0-.68.55-1.23,1.23-1.23h14.36c14.29,0,25.33-14.19,19.75-29.22Z" />
        </g>

        {/* Schlüsselring — Original-Markenvektor, animiert: fährt ein, schließt ab, fährt aus */}
        <g className="pl-key">
          <path
            className="fill-messing"
            d="M44.58,37.31h-7.65v-2.02c0-4.69-3.8-8.49-8.49-8.49s-8.49,3.8-8.49,8.49v10.49c0,4.69,3.8,8.49,8.49,8.49s8.49-3.8,8.49-8.49v-2.02h7.65v-6.45ZM31.89,45.78c0,1.9-1.55,3.45-3.45,3.45s-3.45-1.55-3.45-3.45v-10.49c0-1.9,1.55-3.45,3.45-3.45s3.45,1.55,3.45,3.45v10.49Z"
          />
        </g>
      </svg>

      <div
        className={`flex items-baseline gap-[2px] font-mono uppercase tracking-[0.24em] text-anthrazit/60 ${
          kompakt ? "text-[10px]" : "text-[13px]"
        }`}
      >
        {label}
        <span className="pl-dot">.</span>
        <span className="pl-dot">.</span>
        <span className="pl-dot">.</span>
      </div>
    </div>
  );
}
