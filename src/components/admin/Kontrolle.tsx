import { Card } from "@/components/layout/SectionShell";
import { Icon } from "@/components/icons/Icon";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { KontrollObjekt } from "@/types";

// Deutsches Tausendertrennzeichen, analog zu Mitarbeiterstatistik.tsx.
const zahlenformat = new Intl.NumberFormat("de-DE");

// Eine Zeile der Kontrollseite — Objekt + Mitarbeiter + Status + die erkannten Probleme als
// Tags. Bewusst als flache Liste statt gruppiert nach Problemtyp — ein Objekt kann mehrere
// Probleme gleichzeitig haben, eine Gruppierung würde es dann mehrfach zeigen. Problem-Tags in
// der reservierten Status-Farbe "kritisch" statt eines neutralen Anthrazit-Tons (Oktober 2026
// Chat-Vorgabe "mehr Akzentfarben" — siehe tailwind.config.ts, status.kritisch ist eine FESTE,
// nie als Kategorialfarbe wiederverwendete Bedeutung, hier immer mit Icon + Text kombiniert).
function KontrollZeile({ objekt }: { objekt: KontrollObjekt }) {
  return (
    <div className="flex flex-col gap-xs border-b border-anthrazit/5 py-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-lg font-medium text-anthrazit">{objekt.titel}</p>
        <p className="mt-[2px] text-body text-anthrazit/60">
          {objekt.objektnr} · {objekt.statusLabel}
          {objekt.mitarbeiter && ` · ${objekt.mitarbeiter}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-xs sm:justify-end">
        {objekt.probleme.map((problem) => (
          <span
            key={problem}
            className="inline-flex items-center gap-[4px] rounded-sm bg-status-kritisch/10 px-sm py-[3px] text-small font-medium text-status-kritisch"
          >
            <Icon name="warning" size={13} />
            {problem}
          </span>
        ))}
        {/* Hinweise ändern nichts an der Zählung, deshalb in der milderen Status-Farbe "warnung". */}
        {objekt.hinweise.map((hinweis) => (
          <span
            key={hinweis}
            className="inline-flex items-center gap-[4px] rounded-sm bg-status-warnung/10 px-sm py-[3px] text-small font-medium text-status-warnung"
          >
            <Icon name="warning" size={13} />
            {hinweis}
          </span>
        ))}
      </div>
    </div>
  );
}

// Kontrollseite: unternehmensweite Liste aller Objekte mit erkannten Dateninkonsistenzen in
// OnOffice (siehe ladeKontrollObjekte in onoffice/estate.ts). undefined (statt eines leeren
// Arrays) bedeutet "Live-Abruf fehlgeschlagen" (siehe app/admin/statistik/page.tsx) und zeigt
// einen eigenen Fehlerzustand statt fälschlich "keine Probleme gefunden".
export function Kontrolle({ objekte }: { objekte?: KontrollObjekt[] }) {
  if (objekte === undefined) {
    return (
      <Card className="text-center">
        <p className="text-body text-anthrazit/50">
          Kontrolldaten konnten nicht geladen werden.
        </p>
      </Card>
    );
  }

  if (objekte.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-sm py-xl text-center">
        <Icon name="check" size={32} className="text-status-gut" />
        <p className="max-w-[50ch] text-body text-anthrazit/70">
          Keine Auffälligkeiten gefunden — alle geprüften Objekte sind in OnOffice vollständig und
          widerspruchsfrei hinterlegt.
        </p>
      </Card>
    );
  }

  return (
    <>
      <p className="mb-md flex max-w-[65ch] items-start gap-xs text-body text-anthrazit/60">
        <span>
          {zahlenformat.format(objekte.length)} Objekt{objekte.length === 1 ? "" : "e"} mit
          erkannten Auffälligkeiten — fehlende Provisionsangabe, ein Status, der einem bereits
          gesetzten Verkaufsdatum widerspricht, ein möglicherweise doppelt angelegtes Objekt oder
          ein Verkauf ab dem 1.11.2026, dem eine Pflichtangabe fehlt. Rot zählt nicht, Gelb ist nur
          ein Hinweis.
        </span>
        <InfoTooltip
          felder={[
            "prozent_aussenprovision",
            "prozent_innenprovision",
            "verkauft_am",
            "status2",
            "objekttitel",
            "benutzer",
            "ind_3402_Feld_ObjTech528",
          ]}
          text={
            'Vier geprüfte Regeln: (1) "Provisionsangabe fehlt" — Provisionsfelder leer oder nicht auswertbar. (2) "Status widerspricht Verkaufsdatum" — verkauft_am ist gesetzt, status2 steht aber noch auf einem aktiven/Vorbereitungs-Wert. (3) "Möglicherweise doppelt angelegt" — zwei Datensätze mit identischem Objekttitel UND identischem Verkaufsdatum. (4) Verkäufe ab 1.11.2026 zählen nur mit Wechsel von Aktive Vermarktung oder Reserviert auf in Übergabe, verknüpftem Notartermin, Akquisiteur und Betreuer; fehlt eines davon, steht "Verkauf zählt nicht". Fehlende Verknüpfung zu Käufer oder Verkäufer erscheint nur als gelber Hinweis.'
          }
          breit
          className="mt-[3px]"
        />
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
