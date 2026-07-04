"use client";

import { useMemo, useState } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { berechneFinanzierung, formatiereBetrag, formatiereProzent, GRUNDERWERBSTEUER } from "@/lib/berechnung";
import {
  MAX_RATE_ANTEIL_NETTO,
  STANDARD_EIGENKAPITAL_QUOTE,
  STANDARD_LAUFZEIT_JAHRE,
  STANDARD_MAKLER_PROZENT,
  STANDARD_TILGUNG,
  STANDARD_ZINSSATZ,
} from "@/data/finanzierungDefaults";
import { Bundesland, FinanzierungsDaten, Immobilie } from "@/types";

function Feld({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label mb-xs block">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-sm border border-sand bg-reinweiss px-sm py-xs text-body focus:border-walnuss focus:outline-none";

export function Finanzierung({ immobilie }: { immobilie: Immobilie }) {
  const [daten, setDaten] = useState<FinanzierungsDaten>({
    kaufpreis: immobilie.kaufpreis,
    eigenkapital: Math.round(immobilie.kaufpreis * STANDARD_EIGENKAPITAL_QUOTE),
    zinssatz: STANDARD_ZINSSATZ,
    laufzeitJahre: STANDARD_LAUFZEIT_JAHRE,
    tilgungProzent: STANDARD_TILGUNG,
    bundesland: "Nordrhein-Westfalen",
    mitMakler: true,
    maklerProzent: STANDARD_MAKLER_PROZENT,
  });
  const [nettoEinkommen, setNettoEinkommen] = useState(4500);

  const ergebnis = useMemo(() => berechneFinanzierung(daten), [daten]);
  const maxRate = nettoEinkommen * MAX_RATE_ANTEIL_NETTO;
  const rateImRahmen = ergebnis.monatlicheRate <= maxRate;

  function update<K extends keyof FinanzierungsDaten>(key: K, value: FinanzierungsDaten[K]) {
    setDaten((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SectionShell label="Finanzierung" title="Ihr Finanzierungsrechner">
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Card>
          <h3 className="mb-md">Annahmen</h3>
          <div className="flex flex-col gap-sm">
            <Feld label="Kaufpreis (€)">
              <input
                type="number"
                className={inputClass}
                value={daten.kaufpreis}
                onChange={(e) => update("kaufpreis", Number(e.target.value))}
              />
            </Feld>
            <Feld label="Eigenkapital (€)">
              <input
                type="number"
                className={inputClass}
                value={daten.eigenkapital}
                onChange={(e) => update("eigenkapital", Number(e.target.value))}
              />
            </Feld>
            <div className="grid grid-cols-2 gap-sm">
              <Feld label="Zinssatz (%)">
                <input
                  type="number"
                  step="0.05"
                  className={inputClass}
                  value={daten.zinssatz}
                  onChange={(e) => update("zinssatz", Number(e.target.value))}
                />
              </Feld>
              <Feld label="Tilgung (%)">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={daten.tilgungProzent}
                  onChange={(e) => update("tilgungProzent", Number(e.target.value))}
                />
              </Feld>
            </div>
            <Feld label="Laufzeit (Jahre)">
              <input
                type="number"
                className={inputClass}
                value={daten.laufzeitJahre}
                onChange={(e) => update("laufzeitJahre", Number(e.target.value))}
              />
            </Feld>
            <Feld label="Bundesland (Grunderwerbsteuer)">
              <select
                className={inputClass}
                value={daten.bundesland}
                onChange={(e) => update("bundesland", e.target.value as Bundesland)}
              >
                {Object.keys(GRUNDERWERBSTEUER).map((land) => (
                  <option key={land} value={land}>
                    {land}
                  </option>
                ))}
              </select>
            </Feld>
            <label className="flex items-center gap-xs text-body">
              <input
                type="checkbox"
                checked={daten.mitMakler}
                onChange={(e) => update("mitMakler", e.target.checked)}
              />
              Maklercourtage einrechnen ({daten.maklerProzent}%)
            </label>
            <Feld label="Monatliches Netto-Haushaltseinkommen (€)">
              <input
                type="number"
                className={inputClass}
                value={nettoEinkommen}
                onChange={(e) => setNettoEinkommen(Number(e.target.value))}
              />
            </Feld>
          </div>
        </Card>

        <Card>
          <h3 className="mb-md">Ergebnis</h3>
          <div className="mb-md">
            <p className="label mb-xs">Monatliche Rate</p>
            <p className="font-slab text-4xl font-extrabold text-anthrazit">
              {formatiereBetrag(ergebnis.monatlicheRate)}
            </p>
            <p className={`text-small ${rateImRahmen ? "text-anthrazit/60" : "text-messing"}`}>
              {rateImRahmen ? "Innerhalb" : "Über"} der Komfortgrenze von 35 % des Nettoeinkommens
              ({formatiereBetrag(maxRate)})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <p className="label">Darlehensbetrag</p>
              <p className="font-medium">{formatiereBetrag(ergebnis.darlehensbetrag)}</p>
            </div>
            <div>
              <p className="label">Nebenkosten gesamt</p>
              <p className="font-medium">{formatiereBetrag(ergebnis.nebenkosten.gesamt)}</p>
            </div>
            <div>
              <p className="label">Eigenkapitalanteil</p>
              <p className="font-medium">{formatiereProzent(ergebnis.eigenkapitalanteilProzent)}</p>
            </div>
            <div>
              <p className="label">Gesamtzinsen</p>
              <p className="font-medium">{formatiereBetrag(ergebnis.gesamtzinsen)}</p>
            </div>
          </div>

          <div className="mt-md border-t border-sand pt-sm text-small text-anthrazit/70">
            <p>Grunderwerbsteuer: {formatiereBetrag(ergebnis.nebenkosten.grunderwerbsteuer)}</p>
            <p>Notarkosten: {formatiereBetrag(ergebnis.nebenkosten.notarkosten)}</p>
            <p>Grundbucheintrag: {formatiereBetrag(ergebnis.nebenkosten.grundbucheintrag)}</p>
            {daten.mitMakler && <p>Maklercourtage: {formatiereBetrag(ergebnis.nebenkosten.maklercourtage)}</p>}
          </div>
        </Card>
      </div>
    </SectionShell>
  );
}
