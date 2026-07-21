import { Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { LeadquellenKennzahlen } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Mitarbeiterstatistik.tsx/Kontrolle.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Eine Zeile der Herkunft-Verteilung — Label links, Anzahl rechts, dazwischen ein Balken
// proportional zur häufigsten Quelle (maxAnzahl), damit die Rangfolge auf einen Blick sichtbar
// ist, ohne dass dafür ein eigenes Chart-Werkzeug eingebunden werden muss.
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
      <span className="w-[220px] shrink-0 truncate text-small text-anthrazit">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-sm bg-stein">
        <div className="h-full rounded-sm bg-walnuss" style={{ width: `${breite}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-small text-anthrazit/70">
        {zahlenformat.format(anzahl)}
      </span>
    </div>
  );
}

// "Leadquellen"-Seite im Admin-Bereich: unternehmensweite Übersicht, woher die Eigentümer-
// Kontakte stammen (Feld "Herkunft Kontakt" an der Adresse, siehe ladeLeadquellenKennzahlen in
// onoffice/estate.ts) — Chat-Vorgabe August 2026: "Grundsätzlich würde ich gerne wissen, wieviele
// leads reinkommen übers mailing ... wo kommen die Leads". Der Nutzer wies selbst darauf hin,
// dass diese Auswertung voraussetzt, dass Eigentümer korrekt am Objekt verknüpft UND die
// Herkunft an der Adresse gepflegt ist ("Kann man das nicht irgendwie kontrollieren?") — die
// beiden Hinweiskarten oben machen genau diese Datenlücke sichtbar, statt sie in der Verteilung
// darunter unsichtbar verschwinden zu lassen. undefined (statt eines Objekts mit Nullen)
// bedeutet "Live-Abruf fehlgeschlagen" (siehe app/admin/page.tsx).
export function Leadquellen({ kennzahlen }: { kennzahlen?: LeadquellenKennzahlen }) {
  if (kennzahlen === undefined) {
    return (
      <Card className="text-center">
        <p className="text-small text-anthrazit/50">
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
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/70">
        Woher die Eigentümer-Kontakte unserer {zahlenformat.format(objekteGesamt)} Objekte
        stammen, ausgewertet über das Feld "Herkunft Kontakt" an der jeweiligen Adresse.
      </p>

      {(objekteOhneEigentuemer > 0 || eigentuemerOhneHerkunft > 0) && (
        <div className="mb-lg grid grid-cols-1 gap-sm sm:grid-cols-2">
          {objekteOhneEigentuemer > 0 && (
            <Card className="text-center">
              <Icon name="warning" size={24} className="mx-auto mb-xs text-anthrazit/50" />
              <p className="font-slab text-2xl font-bold text-anthrazit">
                {zahlenformat.format(objekteOhneEigentuemer)}
              </p>
              <p className="label mt-xs">Objekte ohne verknüpften Eigentümer</p>
            </Card>
          )}
          {eigentuemerOhneHerkunft > 0 && (
            <Card className="text-center">
              <Icon name="warning" size={24} className="mx-auto mb-xs text-anthrazit/50" />
              <p className="font-slab text-2xl font-bold text-anthrazit">
                {zahlenformat.format(eigentuemerOhneHerkunft)}
              </p>
              <p className="label mt-xs">
                von {zahlenformat.format(eigentuemerGesamt)} Eigentümern ohne Herkunftsangabe
              </p>
            </Card>
          )}
        </div>
      )}

      <Card>
        <h3 className="mb-sm font-slab text-lg font-bold text-anthrazit">Herkunft der Kontakte</h3>
        {herkunftVerteilung.length === 0 ? (
          <p className="py-sm text-small text-anthrazit/50">
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
