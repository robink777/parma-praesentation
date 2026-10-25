import { Card } from "@/components/layout/SectionShell";
import { ObjektkarteDaten, ObjektkartePlzObjekt } from "@/types";

// Objektliste für eine einzelne, auf der Karte angeklickte PLZ-Fläche — Chat-Vorgabe Oktober
// 2026: "ich will dass jedes Mal wenn man in den einzelnen PLZ Bereich geht, auf der rechten
// Seite sich zu dieser PLZ öffnet. Liste an Objekten usw" (siehe components/admin/Objektkarte.tsx
// für den Klick-Handler, Mitarbeiterstatistik.tsx für die Zustandsführung von gewaehltePlz/-ort).
const zahlenformat = new Intl.NumberFormat("de-DE");
const waehrungformat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const KATEGORIE_LABEL: Record<ObjektkartePlzObjekt["kategorie"], string> = {
  akquise: "Akquise",
  verkaufen: "Verkaufen",
  verkauft: "Verkauft",
};

// Gleiche Töne wie FARBE in Objektkarte.tsx — hier nicht von dort importiert, um die Karte nicht
// an eine Admin-Unterseite zu koppeln, die sie selbst nicht kennen muss.
const KATEGORIE_FARBE: Record<ObjektkartePlzObjekt["kategorie"], string> = {
  akquise: "#503F3D",
  verkaufen: "#CB8E49",
  verkauft: "#A9A29A",
};

function ObjektZeile({ objekt }: { objekt: ObjektkartePlzObjekt }) {
  return (
    <div className="flex items-center justify-between gap-sm border-b border-anthrazit/5 py-sm last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-medium text-anthrazit">{objekt.titel}</p>
        <p className="mt-[2px] text-small text-anthrazit/60">{objekt.objektnr}</p>
      </div>
      <div className="flex shrink-0 items-center gap-sm">
        <span className="text-small text-anthrazit/70">
          {objekt.preis > 0 ? waehrungformat.format(objekt.preis) : "–"}
        </span>
        <span className="inline-flex items-center gap-[4px] whitespace-nowrap rounded-sm bg-stein px-xs py-[2px] text-small text-anthrazit/70">
          <span
            className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
            style={{ background: KATEGORIE_FARBE[objekt.kategorie] }}
          />
          {KATEGORIE_LABEL[objekt.kategorie]}
        </span>
      </div>
    </div>
  );
}

export function PlzObjekte({
  plz,
  ort,
  daten,
}: {
  plz: string | null;
  ort: string | null;
  daten?: ObjektkarteDaten;
}) {
  if (!plz) {
    return (
      <Card className="text-center">
        <p className="text-small text-anthrazit/50">
          Auf eine PLZ-Fläche in der Karte klicken, um die zugehörigen Objekte hier zu sehen.
        </p>
      </Card>
    );
  }

  if (daten === undefined) {
    return (
      <Card className="text-center">
        <p className="text-small text-anthrazit/50">Objektzahlen konnten nicht geladen werden.</p>
      </Card>
    );
  }

  const objekte = daten.jePlz.find((eintrag) => eintrag.plz === plz)?.objekte ?? [];

  if (objekte.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-small text-anthrazit/50">
          Keine Objekte in {plz}
          {ort && ` · ${ort}`}.
        </p>
      </Card>
    );
  }

  return (
    <>
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/70">
        {zahlenformat.format(objekte.length)} Objekt{objekte.length === 1 ? "" : "e"} in {plz}
        {ort && ` · ${ort}`}.
      </p>
      <Card>
        <div className="flex flex-col">
          {objekte.map((objekt) => (
            <ObjektZeile key={objekt.id} objekt={objekt} />
          ))}
        </div>
      </Card>
    </>
  );
}
