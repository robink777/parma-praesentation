import { Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { LeadquellenKennzahlen } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Mitarbeiterstatistik.tsx/Kontrolle.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Eine Zeile der Herkunft-Verteilung — Label links, Anzahl rechts, dazwischen ein Balken
// proportional zur häufigsten Quelle (maxAnzahl), damit die Rangfolge auf einen Blick sichtbar
// ist, ohne dass dafür ein eigenes Chart-Werkzeug eingebunden werden muss. Balkenfarbe chart-2
// (Stahlblau) statt Walnuss — Oktober 2026 Chat-Vorgabe "mehr Akzentfarben an den Datenpunkten"
// (siehe tailwind.config.ts) — dieselbe Farbe, die auch die "Kunden"-Balken im
// Neuzugänge-Diagramm trägt (Uebersicht.tsx), da Leadquellen ebenfalls Kunden-/Kontaktherkunft
// zeigt, nicht Objektdaten.
function HerkunftZeile({
  label,
  anzahl,
  maxAnzahl,
}: {
  label: string;
  anzahl: number;
  maxAnzahl: number;
}) {
  const breite = maxAnzahl === 0 ? 0 : Math.max(4, Math.round((anzahl / maxAnzahl) * 100));
  return (
    <div className="flex items-center gap-sm py-[3px]">
      <span className="w-[180px] shrink-0 truncate text-body text-anthrazit">{label}</span>
      <div className="h-[14px] flex-1 overflow-hidden rounded-sm bg-stein">
        <div className="h-full rounded-sm bg-chart-2" style={{ width: `${breite}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-body text-anthrazit/70">
        {zahlenformat.format(anzahl)}
      </span>
    </div>
  );
}

// "Leadquellen"-Seite im Admin-Bereich: unternehmensweite Übersicht, woher die Eigentümer-
// Kontakte stammen (Feld "Herkunft Kontakt" an der Adresse, siehe ladeLeadquellenKennzahlen in
// onoffice/estate.ts). Die beiden Hinweiskarten oben machen die Datenlücke sichtbar (fehlende
// Eigentümer-Verknüpfung/Herkunft), statt sie in der Verteilung darunter unsichtbar verschwinden
// zu lassen. undefined (statt eines Objekts mit Nullen) bedeutet "Live-Abruf fehlgeschlagen"
// (siehe app/admin/statistik/page.tsx).
export function Leadquellen({ kennzahlen }: { kennzahlen?: LeadquellenKennzahlen }) {
  if (kennzahlen === undefined) {
    return (
      <Card className="text-center">
        <p className="text-body text-anthrazit/50">
          Leadquellen-Daten konnten nicht geladen werden.
        </p>
      </Card>
    );
  }

  const { objekteGesamt, objekteOhneEigentuemer, eigentuemerGesamt, eigentuemerOhneHerkunft, herkunftVerteilung } =
    kennzahlen;
  const maxAnzahl = herkunftVerteilung[0]?.anzahl ?? 0;

  return (
    <>
      <p className="mb-md max-w-[65ch] text-body text-anthrazit/60">
        Woher die Eigentümer-Kontakte unserer {zahlenformat.format(objekteGesamt)} Objekte
        stammen, ausgewertet über das Feld "Herkunft Kontakt" an der jeweiligen Adresse.
      </p>

      {(objekteOhneEigentuemer > 0 || eigentuemerOhneHerkunft > 0) && (
        <div className="mb-md grid grid-cols-1 gap-md sm:grid-cols-2">
          {objekteOhneEigentuemer > 0 && (
            <Card className="relative flex items-center gap-sm">
              <InfoTooltip
                text='Objekte, für die OnOffice keine Eigentümer-Adress-Relation (urn:...:relationTypes:estate:address:owner) hinterlegt hat.'
                className="absolute right-sm top-sm"
              />
              <Icon name="warning" size={24} className="shrink-0 text-status-warnung" />
              <div className="min-w-0">
                <p className="font-slab text-2xl font-bold leading-tight text-anthrazit">
                  {zahlenformat.format(objekteOhneEigentuemer)}
                </p>
                <p className="label">Ohne verknüpften Eigentümer</p>
              </div>
            </Card>
          )}
          {eigentuemerOhneHerkunft > 0 && (
            <Card className="relative flex items-center gap-sm">
              <InfoTooltip
                text='Verknüpfte Eigentümer-Adressen (siehe Relation oben), bei denen das Adressfeld "HerkunftKontakt" leer ist.'
                className="absolute right-sm top-sm"
              />
              <Icon name="warning" size={24} className="shrink-0 text-status-warnung" />
              <div className="min-w-0">
                <p className="font-slab text-2xl font-bold leading-tight text-anthrazit">
                  {zahlenformat.format(eigentuemerOhneHerkunft)}
                </p>
                <p className="label">
                  von {zahlenformat.format(eigentuemerGesamt)} ohne Herkunft
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="relative">
        <InfoTooltip
          text='Je Objekt wird über die OnOffice-Relation "estate:address:owner" die verknüpfte Eigentümer-Adresse ermittelt, dann deren Feld "HerkunftKontakt" ausgelesen (Mehrfachauswahl, pipe-getrennt — jeder einzelne Wert zählt als eigene Nennung, ein Eigentümer kann also in mehreren Zeilen auftauchen).'
          className="absolute right-sm top-sm"
          breit
        />
        <h3 className="mb-sm font-slab text-2xl font-bold text-anthrazit">Herkunft der Kontakte</h3>
        {herkunftVerteilung.length === 0 ? (
          <p className="py-sm text-body text-anthrazit/50">
            Für keinen der verknüpften Eigentümer ist bisher eine Herkunft hinterlegt.
          </p>
        ) : (
          <div className="flex flex-col">
            {herkunftVerteilung.map((eintrag) => (
              <HerkunftZeile
                key={eintrag.label}
                label={eintrag.label}
                anzahl={eintrag.anzahl}
                maxAnzahl={maxAnzahl}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
