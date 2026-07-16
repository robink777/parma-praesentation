"use client";

import { useState } from "react";
import { SectionShell } from "@/components/layout/SectionShell";
import { formatiereBetrag } from "@/lib/berechnung";
import { Immobilie } from "@/types";

// Eigenständiger Navigationspunkt (siehe nav.ts) — ursprünglich als Unterpunkt von "DeepImmo"
// angelegt, auf Nutzerkorrektur hin aber wieder gleichrangig eingeordnet. Inhalt/Zahlen 1:1 aus
// dem ursprünglich mitgeschickten Schaubild übernommen ("Der Effekt zu hoher
// Vermarktungspreise in der Praxis"). Die grafische Darstellung folgt dem vom Nutzer per
// Design-Handoff bereitgestellten Original ("Waterfall Vermarktungspreise.html", aus Parma
// Immobilien-handoff.zip) — ein 1920×1080-Deck-Slide mit Haus-Icon, Baseline und schwebenden
// "Aufschlag"-Pillen/"Verlust"-Badges. Hier als responsive Grid statt fester Bühnengröße
// nachgebaut, Struktur/Farblogik aber bewusst nah am Original.
//
// Marktwert-Basis seit August 2026 wählbar (Chat-Vorgabe: "erstelle statt der 420.000€ eine
// dropdown Funktion in der einmal statisch die 420.000€ stehen und einmal dynamisch der
// hinterlegte Kaufpreis gezogen wird ... Prozentzahlen bleiben gleich, die absoluten Zahlen
// sollen sich aber dann rechnerisch nach dem ausgewählten Preis verändern") — Aufschlag-/
// Verlust-Prozentsätze je Stufe bleiben fix (das ist die reale, aus der Kreissparkasse-Köln-
// Auswertung stammende Kennzahl), nur die daraus abgeleiteten Euro-Beträge werden neu berechnet.
const BEISPIEL_MARKTWERT = 420000;

type MarktwertBasis = "beispiel" | "kaufpreis";

interface Stufe {
  aufschlagProzent: number;
  // Höhe der "Aufschlag"-Pille in px — im Original wächst sie mit der Schwere des Aufschlags
  // (190/250/320px bei +5/+10/+20%), hier proportional übernommen.
  pillHoehe: number;
  // Verlust/Rabatt in Prozent relativ zum Marktwert (negativ) — live gegen die Original-Zahlen
  // geprüft: 420.000 € × (1 + dipProzent/100) trifft "415/407/357 Tsd. €" nahezu exakt (357.000 €
  // bei -15% sogar exakt), das ist also die Formel, mit der auch die dynamische Basis
  // umgerechnet wird.
  dipProzent: number;
  // Nur bei der schwersten Stufe gesetzt ("Verlust", siehe Original) — die beiden leichteren
  // Stufen zeigen nur den nackten Prozentwert.
  dipZusatzlabel?: string;
  schweregrad: "mild" | "mittel" | "hoch";
  tageOnline: number;
}

const STUFEN: Stufe[] = [
  { aufschlagProzent: 5, pillHoehe: 72, dipProzent: -1, schweregrad: "mild", tageOnline: 63 },
  { aufschlagProzent: 10, pillHoehe: 96, dipProzent: -3, schweregrad: "mittel", tageOnline: 281 },
  {
    aufschlagProzent: 20,
    pillHoehe: 124,
    dipProzent: -15,
    dipZusatzlabel: "Verlust",
    schweregrad: "hoch",
    tageOnline: 379,
  },
];

// Die drei Schweregrad-Farben stammen 1:1 aus dem Design-Handoff (dort als oklch(...) auf
// --dip-mild/-mid/-severe hinterlegt) — bewusst NICHT auf die neutrale Walnuss-Skala reduziert
// wie in einer früheren Version dieser Seite: Das Handoff ist die verbindliche Vorlage für genau
// diese Darstellung, sie legt eine eigene, gedeckte Grün-/Bernstein-/Dunkelrot-Ampel für die
// Verlust-Eskalation fest.
const SCHWEREGRAD_FARBEN: Record<Stufe["schweregrad"], { bg: string; text: string }> = {
  mild: { bg: "oklch(88% 0.07 145)", text: "#2A2624" },
  mittel: { bg: "oklch(85% 0.10 80)", text: "#2A2624" },
  hoch: { bg: "oklch(52% 0.12 28)", text: "#FCFCFB" },
};

// Haus-Icon aus dem Design-Handoff, unverändert übernommen (Pfad-Geometrie 1:1), nur auf
// Tailwind-Farbwerte statt CSS-Variablen umgestellt.
function HausIcon() {
  return (
    <svg viewBox="0 0 96 96" fill="none" width="56" height="56" aria-hidden="true">
      <path
        d="M12 44 48 14l36 30"
        stroke="#2A2624"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="22" y="42" width="52" height="40" rx="2" fill="#E1D6C1" stroke="#2A2624" strokeWidth="5" />
      <rect x="42" y="58" width="12" height="24" fill="#2A2624" />
    </svg>
  );
}

// Spaltenraster, geteilt zwischen der Pillen-Zeile und der darunterliegenden Baseline-Zeile,
// damit beide exakt übereinander ausgerichtet bleiben (dieselbe grid-template-columns-Angabe an
// beiden Stellen) — genau wie im Original die "wf-lane"-Spalten von Marktwert- und
// Stufen-Bereich gemeinsam auf einer Baseline sitzen.
const RASTER = "grid-cols-[88px_repeat(3,1fr)] md:grid-cols-[130px_repeat(3,1fr)]";

export function PreisDesWartens({ immobilie }: { immobilie: Immobilie }) {
  const kaufpreisVorhanden = immobilie.kaufpreis > 0;
  const [basis, setBasis] = useState<MarktwertBasis>("beispiel");

  const marktwert =
    basis === "kaufpreis" && kaufpreisVorhanden ? immobilie.kaufpreis : BEISPIEL_MARKTWERT;

  return (
    <SectionShell label="Die Konsequenz" title="Der Effekt zu hoher Vermarktungspreise in der Praxis">
      <p className="mb-lg max-w-[70ch] text-body text-anthrazit/80">
        <strong className="font-medium text-anthrazit">
          Wer einmal reduziert, reduziert meist zweimal
        </strong>{" "}
        – was wie Maklerweisheit klingt, belegen Daten klar: Preisabschläge kosten Vertrauen und
        Umsatz, bezahlt von Makler:innen und Eigentümern gemeinsam.
      </p>

      <div className="mb-xl flex flex-wrap items-center gap-sm">
        <label htmlFor="marktwert-basis" className="label">
          Marktwert-Basis
        </label>
        <select
          id="marktwert-basis"
          value={basis}
          onChange={(e) => setBasis(e.target.value as MarktwertBasis)}
          className="rounded-md border-2 border-asche bg-reinweiss px-sm py-xs text-small text-anthrazit outline-none transition-colors focus:border-messing"
        >
          <option value="beispiel">Beispielwert ({formatiereBetrag(BEISPIEL_MARKTWERT)})</option>
          <option value="kaufpreis" disabled={!kaufpreisVorhanden}>
            {kaufpreisVorhanden
              ? `Kaufpreis dieses Objekts (${formatiereBetrag(immobilie.kaufpreis)})`
              : "Kaufpreis dieses Objekts (kein Kaufpreis hinterlegt)"}
          </option>
        </select>
      </div>

      {/* Obere Reihe: Haus-Icon (Marktwert) + die drei "Aufschlag"-Pillen, alle bodenbündig auf
          der Baseline darunter — je höher der Aufschlag, desto höher die Pille (siehe pillHoehe). */}
      <div className={`grid items-end gap-sm md:gap-md ${RASTER}`}>
        <div className="flex justify-center pb-xs">
          <HausIcon />
        </div>
        {STUFEN.map((stufe) => (
          <div key={stufe.aufschlagProzent} className="flex justify-center">
            <div
              className="flex w-full max-w-[160px] flex-col justify-center rounded-md border-2 border-anthrazit bg-reinweiss px-sm text-center"
              style={{ height: stufe.pillHoehe }}
            >
              <p className="label">Aufschlag</p>
              <p className="mt-[2px] font-slab text-xl font-bold text-messing">
                +{stufe.aufschlagProzent}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Baseline + Marktwert-Preis unter dem Haus-Icon + die "Verlust"-Badges, die von der
          Linie herunterhängen (negativer Top-Margin + reinweiss-Ring, damit sie sichtbar auf der
          Linie "sitzen", wie im Original per box-shadow-Ring simuliert). */}
      <div className={`grid gap-sm border-t-2 border-anthrazit/25 md:gap-md ${RASTER}`}>
        <div className="flex flex-col items-center pt-xs text-center">
          <p className="label">Marktwert</p>
          <p className="font-slab text-lg font-bold text-anthrazit">{formatiereBetrag(marktwert)}</p>
        </div>
        {STUFEN.map((stufe) => {
          const farbe = SCHWEREGRAD_FARBEN[stufe.schweregrad];
          const startpreis = marktwert * (1 + stufe.aufschlagProzent / 100);
          const verkaufspreis = marktwert * (1 + stufe.dipProzent / 100);
          return (
            <div key={stufe.aufschlagProzent} className="flex flex-col items-center">
              <div
                className="-mt-[16px] rounded-md px-md py-xs text-center font-slab font-bold ring-4 ring-reinweiss"
                style={{ background: farbe.bg, color: farbe.text }}
              >
                {stufe.dipZusatzlabel && (
                  <span className="mb-[1px] block font-mono text-[10px] font-medium uppercase tracking-label opacity-80">
                    {stufe.dipZusatzlabel}
                  </span>
                )}
                {stufe.dipProzent}%
              </div>

              <p className="mt-sm font-sans text-small italic text-anthrazit/60">
                {stufe.tageOnline} Tage Online
              </p>

              <div className="mt-sm w-full max-w-[220px]">
                <div className="flex items-center justify-between rounded-sm bg-stein px-sm py-xs text-small text-anthrazit">
                  <span>Startpreis von</span>
                  <span className="font-slab font-bold">{formatiereBetrag(Math.round(startpreis))}</span>
                </div>
                <div
                  className="mt-[3px] flex items-center justify-between rounded-sm px-sm py-xs text-small font-medium"
                  style={{ background: farbe.bg, color: farbe.text }}
                >
                  <span>Verkauf bei</span>
                  <span className="font-slab font-bold">
                    {formatiereBetrag(Math.round(verkaufspreis))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-xl text-small text-anthrazit/50">
        Quelle: Auswertung der Kreissparkasse Köln mit über 1.000 Verkaufsobjekten aus dem Jahr
        2023.
      </p>
    </SectionShell>
  );
}
