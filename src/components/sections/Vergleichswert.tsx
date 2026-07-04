"use client";

import { useMemo } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Immobilie } from "@/types";
import { findeVergleichsobjekte } from "@/lib/vergleich";
import { MOCK_VERGLEICHSPOOL } from "@/lib/onoffice/mock";

function MatchBar({ label, wert }: { label: string; wert: number }) {
  return (
    <div>
      <div className="mb-[2px] flex justify-between text-small text-anthrazit/70">
        <span>{label}</span>
        <span>{Math.round(wert)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-sand">
        <div
          className="h-1.5 rounded-full bg-walnuss"
          style={{ width: `${Math.max(4, wert)}%` }}
        />
      </div>
    </div>
  );
}

export function Vergleichswert({ immobilie }: { immobilie: Immobilie }) {
  const { ergebnisse, meta } = useMemo(
    () => findeVergleichsobjekte(immobilie, MOCK_VERGLEICHSPOOL),
    [immobilie]
  );

  return (
    <SectionShell label="Marktvergleich" title="Vergleichbare Objekte">
      <p className="mb-md max-w-[65ch] text-body text-anthrazit/80">
        Gesucht wird ab einer Übereinstimmung von 80 % in Lage, Wohnfläche, Baujahr und
        Modernisierungsstand. Liegen weniger als drei Objekte über der Schwelle, wird sie
        schrittweise gesenkt, bis mindestens drei Vergleichsobjekte vorliegen.
      </p>
      <p className="label mb-lg">
        Angewandter Schwellwert: {meta.angewandterSchwellwert}% · {meta.gefundeneAnzahl} Objekte gefunden
      </p>

      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        {ergebnisse.map((obj) => (
          <Card key={obj.id}>
            <div className="mb-sm flex items-start justify-between">
              <div>
                <h4>{obj.bezeichnung}</h4>
                <p className="text-small text-anthrazit/60">
                  {obj.wohnflaeche} m² · Baujahr {obj.baujahr} · {obj.kaufpreis.toLocaleString("de-DE")} €
                </p>
              </div>
              <span className="font-slab text-2xl font-bold text-walnuss">{obj.matchScore}%</span>
            </div>
            <div className="flex flex-col gap-xs">
              <MatchBar label="Lage" wert={obj.matchDetails.lage} />
              <MatchBar label="Wohnfläche" wert={obj.matchDetails.wohnflaeche} />
              <MatchBar label="Baujahr" wert={obj.matchDetails.baujahr} />
              <MatchBar label="Modernisierung" wert={obj.matchDetails.modernisierung} />
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
