import { SectionShell, Card } from "@/components/layout/SectionShell";
import { PropertyImage } from "@/components/PropertyImage";
import { Immobilie, Interessent } from "@/types";

function Fakt({ label, wert }: { label: string; wert?: string | number }) {
  if (wert === undefined || wert === "") return null;
  return (
    <div className="min-w-0">
      <p className="label">{label}</p>
      <p className="break-words font-slab text-xl font-semibold text-anthrazit">{wert}</p>
    </div>
  );
}

// Baut die vollständige Anschrift ("Straße Hausnummer, PLZ Ort") als Seitentitel — ersetzt den
// bisherigen Objekttitel (immobilie.bezeichnung) auf ausdrücklichen Nutzerwunsch (Juli 2026).
// Jeder Teil ist optional (kein garantiertes Vollständigkeitslevel der OnOffice-Adressfelder);
// fehlt die Adresse komplett, wird auf die Bezeichnung zurückgefallen, damit der Titel nie leer ist.
function formatAdresse(immobilie: Immobilie): string {
  const strasseZeile = [immobilie.strasse, immobilie.hausnummer].filter(Boolean).join(" ");
  const ortZeile = [immobilie.plz, immobilie.ort].filter(Boolean).join(" ");
  const adresse = [strasseZeile, ortZeile].filter(Boolean).join(", ");
  return adresse || immobilie.bezeichnung;
}

// Eine Zeile im Interessenten-Block — bewusst NUR Übereinstimmung, Kundennummer, Wohnort und
// Kontaktart (siehe Interessent-Typ in types/index.ts), keine Namen/Kontaktdaten. Die
// Übereinstimmung (direkt von OnOffice übernommen, siehe ladeAutomatischeInteressenten in
// estate.ts) steht auf ausdrücklichen Nutzerwunsch (Juli 2026) als ERSTE Spalte.
//
// Feste Spaltenbreiten statt "justify-between" (Juli 2026, auf Nutzerwunsch): Bei
// "justify-between" richtet sich jede Spalte nach ihrem eigenen Inhalt aus, wodurch die Spalten
// je nach Textlänge (z.B. "100%" vs. "80%", "#278" vs. "#12345") von Zeile zu Zeile verrutschen.
// Jede Zeile ist zwar ein eigener Grid-Container (keine gemeinsame Tabelle), aber identische
// grid-cols-Werte in jeder Zeile sorgen dafür, dass die Spalten optisch untereinander stehen wie
// in einer Tabelle. Die ersten beiden Spalten (Prozent, Kundennummer) sind kurz und fix breit;
// Ort/Kontaktart teilen sich den Rest.
// Grid-Template gemeinsam mit InteressentZeile genutzt (siehe dort), damit Kopf- und
// Datenzeilen exakt dieselben Spaltenbreiten verwenden und untereinander ausgerichtet bleiben.
const INTERESSENT_GRID_COLS = "grid-cols-[56px_88px_minmax(0,1fr)_minmax(0,1.3fr)]";

// Kopfzeile über der Interessentenliste (auf Nutzerwunsch Juli 2026 ergänzt) — nutzt dieselben
// Spaltenbreiten wie InteressentZeile, damit die Überschriften exakt über den Werten stehen.
function InteressentKopfzeile() {
  return (
    <div className={`grid ${INTERESSENT_GRID_COLS} items-center gap-xs border-b border-anthrazit/10 pb-xs`}>
      <span className="label">Match</span>
      <span className="label">Kd.-Nr.</span>
      <span className="label">Ort</span>
      <span className="label">Kontaktart</span>
    </div>
  );
}

function InteressentZeile({ interessent }: { interessent: Interessent }) {
  return (
    <div className={`grid ${INTERESSENT_GRID_COLS} items-center gap-xs border-b border-anthrazit/10 py-sm last:border-b-0`}>
      <span className="font-slab text-base font-semibold text-messing">
        {interessent.uebereinstimmung}%
      </span>
      <span className="font-mono text-sm tracking-[0.16em] text-anthrazit/60">
        {interessent.kdNr !== undefined ? `#${interessent.kdNr}` : "—"}
      </span>
      <span className="text-body text-anthrazit">{interessent.ort || "—"}</span>
      <span className="text-body text-anthrazit/70">
        {interessent.kontaktart && interessent.kontaktart.length > 0
          ? interessent.kontaktart.join(", ")
          : "—"}
      </span>
    </div>
  );
}

export function Objektdaten({
  immobilie,
  automatischeInteressenten,
}: {
  immobilie: Immobilie;
  automatischeInteressenten: { liste: Interessent[]; gesamtAnzahl: number } | null;
}) {
  return (
    <SectionShell label="Objektdaten" title={formatAdresse(immobilie)}>
      <PropertyImage
        src={immobilie.bildUrl}
        alt={immobilie.bezeichnung}
        className="mb-lg h-72 w-full overflow-hidden rounded-md"
      />

      <Card className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        <Fakt label="Wohnfläche" wert={immobilie.wohnflaeche ? `${immobilie.wohnflaeche} m²` : undefined} />
        <Fakt
          label="Grundstücksgröße"
          wert={immobilie.grundstuecksflaeche ? `${immobilie.grundstuecksflaeche} m²` : undefined}
        />
        <Fakt label="Objektart" wert={immobilie.objektart} />
        <Fakt label="Objekttyp" wert={immobilie.objekttyp} />
        <Fakt label="Baujahr" wert={immobilie.baujahr} />
        <Fakt label="Energieklasse" wert={immobilie.energieklasse} />
        <Fakt label="Befeuerung" wert={immobilie.befeuerung?.join(", ")} />
        <Fakt label="Heizungsart" wert={immobilie.heizungsart?.join(", ")} />
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

      {automatischeInteressenten && automatischeInteressenten.liste.length > 0 && (
        <div>
          <div className="mb-sm">
            <h3>Automatisch zugeordnete Interessenten</h3>
            <p className="mt-xs flex items-baseline gap-xs">
              <span className="font-slab text-4xl font-semibold leading-none text-anthrazit">
                {automatischeInteressenten.gesamtAnzahl}
              </span>
              <span className="label">
                {automatischeInteressenten.gesamtAnzahl === 1 ? "Übereinstimmung" : "Übereinstimmungen"}
                {" "}(80–100%)
              </span>
            </p>
          </div>
          <Card>
            <div className="flex flex-col">
              <InteressentKopfzeile />
              {automatischeInteressenten.liste.map((interessent) => (
                <InteressentZeile key={interessent.id} interessent={interessent} />
              ))}
            </div>
          </Card>
          {automatischeInteressenten.gesamtAnzahl > automatischeInteressenten.liste.length && (
            <p className="mt-xs text-sm text-anthrazit/60">
              +{automatischeInteressenten.gesamtAnzahl - automatischeInteressenten.liste.length} weitere
            </p>
          )}
        </div>
      )}
    </SectionShell>
  );
}
