import { Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { KontrollObjekt } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Mitarbeiterstatistik.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Eine Zeile der Kontrollseite — Objekt + Mitarbeiter + Status + die erkannten Probleme als
// Tags. Bewusst als flache Liste statt gruppiert nach Problemtyp (Chat-Vorgabe: "in jedem Status
// nachgeschaut werden soll ob alles vernünftig hinterlegt wird") — ein Objekt kann mehrere
// Probleme gleichzeitig haben, eine Gruppierung würde es dann mehrfach zeigen.
function KontrollZeile({ objekt }: { objekt: KontrollObjekt }) {
  return (
    <div className="flex flex-col gap-xs border-b border-anthrazit/5 py-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium text-anthrazit">{objekt.titel}</p>
        <p className="mt-[2px] text-small text-anthrazit/60">
          {objekt.objektnr} · {objekt.statusLabel}
          {objekt.mitarbeiter && ` · ${objekt.mitarbeiter}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-xs sm:justify-end">
        {objekt.probleme.map((problem) => (
          <span
            key={problem}
            className="inline-flex items-center gap-[3px] rounded-sm bg-stein px-xs py-[2px] text-small text-anthrazit/70"
          >
            <Icon name="warning" size={12} />
            {problem}
          </span>
        ))}
      </div>
    </div>
  );
}

// Kontrollseite: unternehmensweite Liste aller Objekte mit erkannten Dateninkonsistenzen in
// OnOffice (siehe ladeKontrollObjekte in onoffice/estate.ts) — Chat-Vorgabe August 2026: "ich
// will auch eine Kontrollseite einrichten wo in jedem Status nachgeschaut werden soll ob alles
// vernünftig in OnOffice hinterlegt wird" bzw. zuvor "das mit den Objekten funktioniert irgendwie
// immer noch nicht ... vielleicht als 3. Punkt in der Navigation". undefined (statt eines leeren
// Arrays) bedeutet "Live-Abruf fehlgeschlagen" (siehe app/admin/page.tsx) und zeigt einen eigenen
// Fehlerzustand statt fälschlich "keine Probleme gefunden".
export function Kontrolle({ objekte }: { objekte?: KontrollObjekt[] }) {
  if (objekte === undefined) {
    return (
      <Card className="text-center">
        <p className="text-small text-anthrazit/50">
          Kontrolldaten konnten nicht geladen werden.
        </p>
      </Card>
    );
  }

  if (objekte.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-sm py-2xl text-center">
        <Icon name="check" size={32} className="text-anthrazit/40" />
        <p className="max-w-[50ch] text-body text-anthrazit/70">
          Keine Auffälligkeiten gefunden — alle geprüften Objekte sind in OnOffice vollständig und
          widerspruchsfrei hinterlegt.
        </p>
      </Card>
    );
  }

  return (
    <>
      <p className="mb-lg max-w-[65ch] text-body text-anthrazit/70">
        {zahlenformat.format(objekte.length)} Objekt{objekte.length === 1 ? "" : "e"} mit
        erkannten Auffälligkeiten — fehlende Provisionsangabe, ein Status, der einem bereits
        gesetzten Verkaufsdatum widerspricht, oder ein möglicherweise doppelt angelegtes Objekt.
      </p>
      <Card>
        <div className="flex flex-col">
          {objekte.map((objekt) => (
            <KontrollZeile key={objekt.id} objekt={objekt} />
          ))}
        </div>
      </Card>
    </>
  );
}
