import Link from "next/link";
import { Card } from "@/components/layout/SectionShell";
import { ObjektkarteDaten, ObjektkartePlzObjekt } from "@/types";

// Objektliste für eine einzelne, auf der Karte angeklickte PLZ-Fläche — ein Klick auf der
// (seit Oktober 2026 eigenständigen) Karten-Seite navigiert hierher mit der geklickten PLZ als
// Query-Parameter (siehe KartenAnsicht.tsx, app/admin/statistik/page.tsx, StatistikAnsicht.tsx).
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
// an eine Admin-Unterseite zu koppeln, die sie selbst nicht kennen muss. BEWUSST NICHT die neue
// chart-Palette: Diese drei Farben sind die Legende der Karte selbst (Objektkarte.tsx), die
// Konsistenz mit der Karte ist hier wichtiger als die Konsistenz mit den übrigen
// Statistik-Diagrammen.
const KATEGORIE_FARBE: Record<ObjektkartePlzObjekt["kategorie"], string> = {
  akquise: "#503F3D",
  verkaufen: "#CB8E49",
  verkauft: "#A9A29A",
};

function ObjektZeile({ objekt }: { objekt: ObjektkartePlzObjekt }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-md gap-y-xs border-b border-anthrazit/5 py-sm last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-lg font-medium text-anthrazit">{objekt.titel}</p>
        <p className="mt-[2px] text-body text-anthrazit/50">{objekt.objektnr}</p>
      </div>
      <div className="flex shrink-0 items-center gap-sm">
        <span className="text-body text-anthrazit/70">
          {objekt.preis > 0 ? waehrungformat.format(objekt.preis) : "–"}
        </span>
        <span className="inline-flex items-center gap-xs whitespace-nowrap rounded-sm bg-stein px-sm py-[3px] text-body text-anthrazit/70">
          <span
            className="inline-block h-[10px] w-[10px] shrink-0 rounded-full"
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
        <p className="text-body text-anthrazit/50">
          Auf eine PLZ-Fläche in der Karte klicken, um die zugehörigen Objekte hier zu sehen.
        </p>
        <Link
          href="/admin"
          className="mt-sm inline-block text-body font-medium text-walnuss underline underline-offset-4 hover:text-messing"
        >
          Zur Karte
        </Link>
      </Card>
    );
  }

  if (daten === undefined) {
    return (
      <Card className="text-center">
        <p className="text-body text-anthrazit/50">Objektzahlen konnten nicht geladen werden.</p>
      </Card>
    );
  }

  const objekte = daten.jePlz.find((eintrag) => eintrag.plz === plz)?.objekte ?? [];

  if (objekte.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-body text-anthrazit/50">
          Keine Objekte in {plz}
          {ort && ` · ${ort}`}.
        </p>
      </Card>
    );
  }

  return (
    <>
      <p className="mb-md max-w-[65ch] text-body text-anthrazit/60">
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
