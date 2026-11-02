import Image from "next/image";
import { Card } from "@/components/layout/SectionShell";
import { formatiereBetrag } from "@/lib/berechnung";
import { MitarbeiterObjekt } from "@/types";

// Gemeinsame Listen-Darstellung für die beiden Admin-Detailseiten, die eine Menge von
// MitarbeiterObjekt zeigen: app/admin/provisionsfehler/page.tsx (die "N ohne Angabe"-Hinweise)
// und das neue app/admin/objektliste/page.tsx (Klick auf eine KPI-Kachel der Übersicht, Nutzer-
// Vorgabe November 2026: "Ich hätte gerne dass man aus der Gesamtübersicht in die jeweiligen
// Listen navigieren kann"). Ursprünglich lag diese Darstellung direkt inline in
// provisionsfehler/page.tsx — jetzt ausgelagert, damit beide Seiten garantiert identisch
// aussehen und sich eine künftige Änderung (z.B. Sortierung, Spalten) nicht zweimal pflegen muss.
//
// `zeigeDetails` steuert zusätzliche Provisionsvorlauf-/Vermarktungsdauer-Angaben je Zeile: auf
// provisionsfehler bewusst AUS (Provisionsvorlauf ist dort für JEDES Objekt per Definition "–",
// das anzuzeigen wäre nur Rauschen), auf der neuen Objektliste bewusst AN (dort sind das
// nützliche Zusatzinfos, unabhängig davon, welche der drei "alle"-Kacheln — Objektvolumen,
// Provisionsvorlauf, Ø Vermarktungsdauer — konkret angeklickt wurde).
export function ObjektlisteKarte({
  objekte,
  leerText,
  zeigeDetails = false,
}: {
  objekte: MitarbeiterObjekt[] | undefined;
  leerText: string;
  zeigeDetails?: boolean;
}) {
  if (objekte === undefined) {
    return (
      <Card compact className="text-center">
        <p className="text-body text-anthrazit/50">Objekte konnten nicht geladen werden.</p>
      </Card>
    );
  }

  if (objekte.length === 0) {
    return (
      <Card compact className="py-xl text-center">
        <p className="text-body text-anthrazit/70">{leerText}</p>
      </Card>
    );
  }

  return (
    <Card compact>
      <div className="flex flex-col">
        {objekte.map((objekt) => (
          <div
            key={objekt.id}
            className="flex items-center gap-sm border-b border-anthrazit/5 py-sm last:border-b-0"
          >
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-sm bg-sand">
              {objekt.titelbildUrl && (
                <Image src={objekt.titelbildUrl} alt="" fill className="object-cover" sizes="64px" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-anthrazit">{objekt.titel || "Ohne Titel"}</p>
              <p className="mt-[2px] font-mono text-small text-anthrazit/50">{objekt.objektnr}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-body font-medium text-anthrazit">{formatiereBetrag(objekt.preis)}</p>
              {zeigeDetails && (
                <p className="mt-[2px] text-small text-anthrazit/50">
                  {objekt.provisionsvorlauf === null
                    ? "Provision: –"
                    : `Provision: ${formatiereBetrag(objekt.provisionsvorlauf)}`}
                  {" · "}
                  {objekt.vermarktungsdauerTage === null ? "Dauer: –" : `${objekt.vermarktungsdauerTage} Tage`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
