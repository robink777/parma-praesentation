"use client";

import { Fragment, useState } from "react";
import { SectionShell, Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import {
  LEISTUNGSKATEGORIEN,
  LEISTUNGSPAKETE,
  LEISTUNGS_KENNZAHLEN,
  RAHMENBEDINGUNGEN,
} from "@/data/leistungsversprechen";
import { LeistungsStatus, LeistungsversprechenVereinbarung, LeistungspaketId } from "@/types";

const INPUT_CLASS =
  "rounded-sm border border-asche bg-reinweiss text-anthrazit outline-none transition-colors focus:border-messing focus:ring-1 focus:ring-messing";

function Feld({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="label mb-xs block">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} w-full px-sm py-xs`}
      />
    </label>
  );
}

function StatusZelle({ status }: { status: LeistungsStatus }) {
  if (status === "ja") return <Icon name="check" size={18} className="mx-auto text-messing" />;
  if (status === "optional") return <span className="text-small text-anthrazit/50">optional</span>;
  return <span className="text-anthrazit/30">—</span>;
}

// Spalten der Detail-Tabelle — bewusst als Liste mit paket.id, damit sich die Hervorhebung der
// Spalte des gewählten Pakets (siehe gewaehltesPaket-Vergleich weiter unten) direkt aus derselben
// Quelle speist wie die Paketkarten und die § 10-Auswahlbuttons, statt drei Stellen unabhängig
// synchron halten zu müssen.
const LEISTUNGS_SPALTEN: { id: LeistungspaketId; label: string }[] = [
  { id: "basis", label: "Basis" },
  { id: "komfort", label: "Komfort" },
  { id: "premium", label: "Premium" },
];

export function Leistungsversprechen() {
  const [vereinbarung, setVereinbarung] = useState<LeistungsversprechenVereinbarung>({});

  function update<K extends keyof LeistungsversprechenVereinbarung>(
    key: K,
    value: LeistungsversprechenVereinbarung[K]
  ) {
    setVereinbarung((v) => ({ ...v, [key]: value }));
  }

  return (
    <SectionShell label="Leistungsversprechen" title="Unser Leistungsversprechen">
      <p className="mb-lg w-full text-body text-anthrazit/80">
        Drei Pakete, ein Anspruch: Sie zahlen nur, wenn wir erfolgreich verkaufen. Wählen Sie den
        Leistungsumfang, der zu Ihrer Immobilie und Ihren Wünschen passt.
      </p>

      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-3">
        {LEISTUNGS_KENNZAHLEN.map((k) => (
          <Card key={k.label} className="text-center">
            <p className="font-slab text-3xl font-bold text-walnuss">{k.wert}</p>
            <p className="label mt-xs">{k.label}</p>
          </Card>
        ))}
      </div>

      <h3 className="mb-sm">Unsere Pakete</h3>
      <p className="mb-sm text-small text-anthrazit/60">Paket antippen, um es auszuwählen.</p>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-3">
        {LEISTUNGSPAKETE.map((paket) => {
          const aktiv = vereinbarung.gewaehltesPaket === paket.id;
          return (
            <button
              key={paket.id}
              type="button"
              aria-pressed={aktiv}
              onClick={() => update("gewaehltesPaket", paket.id as LeistungspaketId)}
              className="block h-full w-full text-left"
            >
              <Card
                className={`relative h-full transition-colors ${
                  aktiv
                    ? "border-2 border-messing bg-messing/[0.06]"
                    : paket.empfohlen
                      ? "border-2 border-messing"
                      : "border-2 border-transparent hover:border-messing/50"
                }`}
              >
                {(aktiv || paket.empfohlen) && (
                  <span className="label absolute -top-3 left-md flex items-center gap-[4px] rounded-sm bg-messing px-sm py-[2px] text-reinweiss">
                    {aktiv && <Icon name="check" size={12} />}
                    {aktiv ? "Ausgewählt" : "Empfohlen"}
                  </span>
                )}
                <p className="font-slab text-2xl font-bold text-anthrazit">{paket.name}</p>
                <p className="mb-sm text-small text-anthrazit/70">{paket.beschreibung}</p>
                <p className="mb-sm font-slab text-3xl font-bold text-walnuss">
                  {paket.provisionProzent.toLocaleString("de-DE")} %
                </p>
                <ul className="flex flex-col gap-xs">
                  {paket.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-xs text-small text-anthrazit/80">
                      <Icon name="check" size={16} className="mt-[2px] shrink-0 text-messing" />
                      {h}
                    </li>
                  ))}
                </ul>
              </Card>
            </button>
          );
        })}
      </div>

      <h3 className="mb-sm">Leistungen im Detail</h3>
      <div className="mb-lg overflow-x-auto rounded-md bg-stein">
        <table className="w-full min-w-[640px] border-collapse text-small">
          <thead>
            <tr className="border-b border-asche/60 text-left">
              <th className="w-1/2 p-sm font-medium text-anthrazit">Leistung</th>
              {LEISTUNGS_SPALTEN.map((spalte) => (
                <th
                  key={spalte.id}
                  className={`p-sm text-center font-medium transition-colors ${
                    vereinbarung.gewaehltesPaket === spalte.id
                      ? "bg-messing/10 text-walnuss"
                      : "text-anthrazit"
                  }`}
                >
                  {spalte.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEISTUNGSKATEGORIEN.map((kategorie) => (
              <Fragment key={kategorie.nummer}>
                <tr className="border-b border-asche/60 bg-sand/40">
                  <td colSpan={4} className="p-sm">
                    <span className="label">
                      § {kategorie.nummer} {kategorie.titel}
                    </span>
                  </td>
                </tr>
                {kategorie.positionen.map((pos) => (
                  <tr key={pos.bezeichnung} className="border-b border-asche/30">
                    <td className="p-sm text-anthrazit/90">{pos.bezeichnung}</td>
                    {LEISTUNGS_SPALTEN.map((spalte) => (
                      <td
                        key={spalte.id}
                        className={`p-sm text-center transition-colors ${
                          vereinbarung.gewaehltesPaket === spalte.id ? "bg-messing/10" : ""
                        }`}
                      >
                        <StatusZelle status={pos[spalte.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-sm">Rahmenbedingungen</h3>
      <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-2">
        {RAHMENBEDINGUNGEN.map((r) => (
          <Card key={r.nummer}>
            <p className="label mb-xs">
              § {r.nummer} · {r.titel}
            </p>
            <p className="text-small text-anthrazit/80">{r.text}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-lg">
        <h4 className="mb-sm">§ 10 Paketwahl & Vereinbarung</h4>
        <div className="mb-md flex flex-wrap gap-sm">
          {LEISTUNGSPAKETE.map((paket) => {
            const aktiv = vereinbarung.gewaehltesPaket === paket.id;
            return (
              <button
                key={paket.id}
                onClick={() => update("gewaehltesPaket", paket.id as LeistungspaketId)}
                className={
                  aktiv
                    ? "rounded-sm border-2 border-messing bg-messing px-md py-xs font-medium text-reinweiss"
                    : "rounded-sm border-2 border-asche bg-reinweiss px-md py-xs font-medium text-anthrazit transition-colors hover:border-messing"
                }
              >
                {paket.name}
              </button>
            );
          })}
        </div>

        <div className="mb-md grid grid-cols-1 gap-sm md:grid-cols-2">
          <Feld label="Ort" value={vereinbarung.unterschriftOrt} onChange={(v) => update("unterschriftOrt", v)} />
          <Feld
            label="Datum"
            type="date"
            value={vereinbarung.unterschriftDatum}
            onChange={(v) => update("unterschriftDatum", v)}
          />
          <label className="block">
            <span className="label mb-xs block">Auftragsnummer</span>
            <span className="inline-flex w-full items-center">
              <span
                className={`${INPUT_CLASS} shrink-0 whitespace-nowrap rounded-r-none border-r-0 bg-stein px-sm py-xs text-anthrazit/60`}
              >
                PI-2026-
              </span>
              <input
                type="text"
                value={vereinbarung.auftragsnummer ?? ""}
                onChange={(e) => update("auftragsnummer", e.target.value)}
                className={`${INPUT_CLASS} w-full rounded-l-none px-sm py-xs`}
              />
            </span>
          </label>
          <Feld label="Berater/in" value={vereinbarung.beraterIn} onChange={(v) => update("beraterIn", v)} />
        </div>
      </Card>
    </SectionShell>
  );
}
