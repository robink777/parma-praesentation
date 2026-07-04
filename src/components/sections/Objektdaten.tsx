import { SectionShell, Card } from "@/components/layout/SectionShell";
import { PropertyImage } from "@/components/PropertyImage";
import { Immobilie } from "@/types";

function Fakt({ label, wert }: { label: string; wert?: string | number }) {
  if (wert === undefined || wert === "") return null;
  return (
    <div className="min-w-0">
      <p className="label">{label}</p>
      <p className="break-words font-slab text-xl font-semibold text-anthrazit">{wert}</p>
    </div>
  );
}

export function Objektdaten({ immobilie }: { immobilie: Immobilie }) {
  return (
    <SectionShell label="Objektdaten" title={immobilie.bezeichnung}>
      <PropertyImage
        src={immobilie.bildUrl}
        alt={immobilie.bezeichnung}
        className="mb-lg h-72 w-full overflow-hidden rounded-md"
      />

      <Card className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        <Fakt label="Kaufpreis" wert={`${immobilie.kaufpreis.toLocaleString("de-DE")} €`} />
        <Fakt label="Wohnfläche" wert={immobilie.wohnflaeche ? `${immobilie.wohnflaeche} m²` : undefined} />
        <Fakt label="Grundstück" wert={immobilie.grundstuecksflaeche ? `${immobilie.grundstuecksflaeche} m²` : undefined} />
        <Fakt label="Zimmer" wert={immobilie.anzahlZimmer} />
        <Fakt label="Baujahr" wert={immobilie.baujahr} />
        <Fakt label="Zustand" wert={immobilie.zustand} />
        <Fakt label="Energieklasse" wert={immobilie.energieklasse} />
        <Fakt label="Objektart" wert={immobilie.objektart} />
      </Card>

      {immobilie.modernisierungen && immobilie.modernisierungen.length > 0 && (
        <div className="mb-lg">
          <h3 className="mb-sm">Modernisierungen</h3>
          <ul className="flex flex-col gap-xs">
            {immobilie.modernisierungen.map((m) => (
              <li key={m} className="flex items-center gap-xs text-body">
                <span className="h-1.5 w-1.5 rounded-full bg-walnuss" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {immobilie.objektbeschreibung && (
        <div>
          <h3 className="mb-sm">Beschreibung</h3>
          <p className="max-w-[65ch] text-body text-anthrazit/90">{immobilie.objektbeschreibung}</p>
        </div>
      )}
    </SectionShell>
  );
}
