import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { ObjektkarteDaten, ObjektkartePlzEintrag, ObjektkartePlzObjekt } from "@/types";
import plzOrte from "@/data/geo/landkreis-dueren-plz-orte.json";

// Rechtes Viertel neben der Karte (siehe KarteBereich.tsx, "die PLZ Navi kannst du oben auch raus
// nehmen und dann bei Karte in die ganz rechte 1/4 des Bildes legen"). Zeigt standardmäßig eine
// Liste ALLER PLZ-Flächen mit ihren Kategorie-Zahlen — Oktober 2026 Chat-Vorgabe: "Die Ebenen mit
// den PLZ Angaben, die du über die Karte gelegt hast, machen die Karte unübersichtlich, leg diese
// Informationen lieber in die Navi rechts daneben und lass die Karte frei". Übernimmt damit genau
// die Zahlen, die vorher als schwebende Stat-Karten auf der Karte selbst lagen (siehe Git-Historie
// Objektkarte.tsx, erzeugeMarkerElement) — nur eben als aufgeräumte Liste statt als Overlay.
// Ein Klick auf eine Zeile wählt dieselbe PLZ aus wie ein Klick auf die Kartenfläche (onPlzWahl —
// derselbe Setter wie onPlzKlick, siehe AdminDashboard.tsx); danach zeigt die Liste die
// Objektdetails dieser einen PLZ mit einem Rückweg zur Gesamtliste.
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

const KATEGORIEN: ObjektkartePlzObjekt["kategorie"][] = ["akquise", "verkaufen", "verkauft"];

function ortFuerPlz(plz: string): string | null {
  return (plzOrte as Record<string, string>)[plz] ?? null;
}

// Die 18 PLZ-Gebiete des Landkreises in fester, nach PLZ sortierter Reihenfolge — dieselbe
// Grundmenge wie plzGeoJson.features in Objektkarte.tsx (plzOrte trägt exakt dieselben 18
// Schlüssel). BEWUSST NICHT direkt über daten.jePlz iteriert: Live beobachtet enthält das auch
// vereinzelte PLZ außerhalb des Landkreises (fehlerhafte/abweichende Adresspflege in OnOffice,
// z.B. "41812") — für die, die auf der Karte selbst keine Fläche haben, wäre ein Klick in dieser
// Liste wirkungslos (kein Hervorheben möglich). Objekte mit einer PLZ außerhalb dieser 18 zählen
// weiterhin ganz normal in die unternehmensweiten Summen (siehe Objektkarte.tsx, summe), fehlen
// hier aber bewusst als eigene Zeile.
const PLZ_REIHENFOLGE = Object.keys(plzOrte as Record<string, string>).sort();

function leereEintrag(plz: string): ObjektkartePlzEintrag {
  return { plz, akquise: 0, verkaufen: 0, verkauft: 0, objekte: [] };
}

// Eine Zeile der Gesamtliste — ersetzt die vorige schwebende Stat-Karte auf der Karte selbst
// (PLZ/Ort + die drei Kategorie-Punkte mit Zahl, gleiche Farben/Reihenfolge wie dort). Zweizeilig
// statt einer einzelnen, gedrängten Zeile — das rechte Viertel ist dafür schlicht zu schmal (live
// geprüft: "52372 · Kreuzau" lief in einer Zeile mit drei Zahlen daneben in "52372 …" ab).
function PlzUebersichtZeile({
  eintrag,
  onWaehlen,
}: {
  eintrag: ObjektkartePlzEintrag;
  onWaehlen: () => void;
}) {
  const ort = ortFuerPlz(eintrag.plz);
  return (
    <button
      type="button"
      onClick={onWaehlen}
      className="block w-full border-b border-anthrazit/5 py-sm text-left last:border-b-0 hover:bg-stein"
    >
      <p className="truncate text-body font-medium text-anthrazit">
        {eintrag.plz}
        {ort && <span className="font-normal text-anthrazit/50"> · {ort}</span>}
      </p>
      <div className="mt-[2px] flex items-center gap-sm">
        {KATEGORIEN.map((kat) => (
          <span
            key={kat}
            title={`${KATEGORIE_LABEL[kat]}: ${eintrag[kat]}`}
            className="flex items-center gap-[4px] text-small text-anthrazit/70"
          >
            <span
              className="inline-block h-[7px] w-[7px] rounded-full"
              style={{ background: KATEGORIE_FARBE[kat], opacity: eintrag[kat] > 0 ? 1 : 0.25 }}
            />
            {eintrag[kat]}
          </span>
        ))}
      </div>
    </button>
  );
}

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
  onPlzWahl,
}: {
  plz: string | null;
  ort: string | null;
  daten?: ObjektkarteDaten;
  onPlzWahl: (plz: string, ort: string) => void;
}) {
  if (daten === undefined) {
    return <p className="text-small text-anthrazit/50">Objektzahlen konnten nicht geladen werden.</p>;
  }

  if (!plz) {
    return (
      <div>
        <p className="mb-sm flex items-center gap-xs">
          <span className="label">Alle PLZ-Gebiete</span>
          <InfoTooltip
            felder={["status2", "status"]}
            text={
              'Kategorie je Objekt (status2 hat Vorrang vor status): status2 = verkauft → "Verkauft". status2 eine Akquise-Unterstufe (z.B. in_akquise, vorbereitung, Akquise - Auftrag) → "Akquise". Sonst status = 1 (Aktiv) → "Verkaufen". Alles andere (z.B. Marktbeobachtung) zählt in keiner der drei Kategorien.'
            }
            breit
          />
        </p>
        <div className="flex flex-col">
          {PLZ_REIHENFOLGE.map((einePlz) => {
            const eintrag = daten.jePlz.find((e) => e.plz === einePlz) ?? leereEintrag(einePlz);
            return (
              <PlzUebersichtZeile
                key={einePlz}
                eintrag={eintrag}
                onWaehlen={() => onPlzWahl(einePlz, ortFuerPlz(einePlz) ?? "")}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const objekte = daten.jePlz.find((eintrag) => eintrag.plz === plz)?.objekte ?? [];

  return (
    <div>
      {/* Leerer String statt null, damit onPlzWahl dieselbe (plz: string, ort: string)-Signatur
          wie onPlzKlick (Kartenklick, siehe Objektkarte.tsx) behalten kann — "!plz" weiter unten
          UND in diesem Zweig behandelt einen leeren String bereits korrekt wie "keine Auswahl". */}
      <button
        type="button"
        onClick={() => onPlzWahl("", "")}
        className="label mb-sm block text-walnuss/60 hover:text-walnuss"
      >
        ← Alle PLZ
      </button>
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
