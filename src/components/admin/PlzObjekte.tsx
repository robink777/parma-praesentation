import { ObjektkarteDaten, ObjektkartePlzObjekt } from "@/types";

// Objektliste für eine auf der Karte angeklickte PLZ-Fläche — seit Oktober 2026 kein eigener
// Navi-Reiter mehr, sondern fest das rechte Viertel neben der Karte selbst (Chat-Vorgabe: "die
// PLZ Navi kannst du oben auch raus nehmen und dann bei Karte in die ganz rechte 1/4 des Bildes
// legen", siehe KarteBereich.tsx). Deshalb KEIN eigener Card-Rahmen (bg/rounded/shadow) mehr hier
// — KarteBereich.tsx stellt die Reinweiss-Fläche bereits, dieselbe wie bei den Übersicht-Kacheln.
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
// an eine Admin-Unterseite zu koppeln, die sie selbst nicht kennen muss. BEWUSST NICHT die
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
    <div className="border-b border-anthrazit/5 py-sm last:border-b-0">
      <p className="truncate text-body font-medium text-anthrazit">{objekt.titel}</p>
      <p className="mt-[2px] text-small text-anthrazit/50">{objekt.objektnr}</p>
      <div className="mt-xs flex items-center gap-xs">
        <span
          className="inline-block h-[8px] w-[8px] shrink-0 rounded-full"
          style={{ background: KATEGORIE_FARBE[objekt.kategorie] }}
        />
        <span className="text-small text-anthrazit/70">{KATEGORIE_LABEL[objekt.kategorie]}</span>
        <span className="ml-auto text-small font-medium text-anthrazit/70">
          {objekt.preis > 0 ? waehrungformat.format(objekt.preis) : "–"}
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
      <p className="text-small text-anthrazit/50">
        Auf eine PLZ-Fläche in der Karte klicken, um die zugehörigen Objekte hier zu sehen.
      </p>
    );
  }

  if (daten === undefined) {
    return <p className="text-small text-anthrazit/50">Objektzahlen konnten nicht geladen werden.</p>;
  }

  const objekte = daten.jePlz.find((eintrag) => eintrag.plz === plz)?.objekte ?? [];

  return (
    <div>
      <p className="label mb-[2px]">
        {plz}
        {ort && ` · ${ort}`}
      </p>
      <p className="mb-sm text-small text-anthrazit/50">
        {zahlenformat.format(objekte.length)} Objekt{objekte.length === 1 ? "" : "e"}
      </p>
      {objekte.length === 0 ? (
        <p className="text-small text-anthrazit/50">Keine Objekte in dieser PLZ.</p>
      ) : (
        <div className="flex flex-col">
          {objekte.map((objekt) => (
            <ObjektZeile key={objekt.id} objekt={objekt} />
          ))}
        </div>
      )}
    </div>
  );
}
