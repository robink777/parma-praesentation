import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/layout/SectionShell";
import { formatiereBetrag } from "@/lib/berechnung";
import { ladeObjekteOhneProvisionsangabe } from "@/lib/onoffice/mitarbeiterstatistik";

// Kein Caching — Live-Abruf bei jedem Aufruf, analog zum restlichen Admin-Bereich (siehe
// lib/onoffice/client.ts, cache: "no-store").
export const dynamic = "force-dynamic";

// Detailseite zu den "N ohne Angabe"-Hinweisen auf den KPI-Kacheln "Provisionsvorlauf gesamt" und
// "Provisionsvolumen {Jahr}" (siehe components/shared/KpiKachel.tsx, Nutzer-Vorgabe Oktober 2026:
// "beim Hovern über die ... Objekte ohne Provisionseintrag eine neue Seite öffnen wo genau diese
// Objekte angezeigt werden, damit man die Fehler direkt in OnOffice suchen kann und beheben
// kann"). Bewusst KLICK statt wörtlichem Hover — eine Navigation direkt beim Hovern würde die
// Seite schon beim versehentlichen Drüberfahren verlassen; die KPI-Kachel bekommt stattdessen
// einen klickbaren, unterstrichenen Hinweis mit Hover-Zustand (siehe KpiKachel.tsx). Zeigt bewusst
// nur Objektnummer/Titel/Preis — KEIN direkter Tiefenlink ins OnOffice-Backend, dessen genaues
// URL-Schema für diesen Account nicht bekannt ist (lieber kein geratener Link als ein falscher);
// die Objektnummer ist der Suchbegriff, mit dem sich der Datensatz in OnOffice selbst finden
// lässt.
const QUELLEN_TEXT = {
  gesamt: {
    titel: "Provisionsvorlauf — Objekte ohne Angabe",
    beschreibung:
      "Diese Objekte (aktive Vermarktung + Aufarbeitung) haben keine auswertbare Außen- oder Innen-Provision in OnOffice hinterlegt und fließen deshalb nicht in die Summe \"Provisionsvorlauf gesamt\" ein.",
  },
  verkauft: {
    titel: "Provisionsvolumen — Objekte ohne Angabe",
    beschreibung:
      "Diese im laufenden Kalenderjahr verkauften Objekte haben keine auswertbare Außen- oder Innen-Provision in OnOffice hinterlegt und fließen deshalb nicht in die Summe \"Provisionsvolumen\" des Jahres ein.",
  },
} as const;

export default async function ProvisionsfehlerPage({
  searchParams,
}: {
  searchParams: Promise<{ quelle?: string }>;
}) {
  const { quelle: quelleParam } = await searchParams;
  const quelle = quelleParam === "verkauft" ? "verkauft" : "gesamt";
  const text = QUELLEN_TEXT[quelle];

  const objekte = await ladeObjekteOhneProvisionsangabe(
    quelle === "verkauft" ? "verkauftJahr" : "gesamt"
  ).catch(() => undefined);

  return (
    <div className="min-h-screen bg-stein">
      <header className="flex items-center gap-sm px-lg py-sm">
        <Image src="/logos/immobilien-quer.svg" alt="Parma Immobilien" width={104} height={26} priority />
        <div className="h-5 w-px bg-walnuss/15" />
        <p className="label">Admin-Bereich</p>
      </header>
      <main className="mx-auto max-w-content px-lg pb-xl">
        <Link href="/admin" className="mb-md inline-block text-small text-anthrazit/60 hover:text-anthrazit">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="mb-xs font-slab text-2xl font-bold text-anthrazit">{text.titel}</h1>
        <p className="mb-lg max-w-[65ch] text-body text-anthrazit/60">{text.beschreibung}</p>

        {objekte === undefined ? (
          <Card compact className="text-center">
            <p className="text-body text-anthrazit/50">Objekte konnten nicht geladen werden.</p>
          </Card>
        ) : objekte.length === 0 ? (
          <Card compact className="py-xl text-center">
            <p className="text-body text-anthrazit/70">
              Keine Objekte ohne Provisionsangabe gefunden — die Liste ist leer.
            </p>
          </Card>
        ) : (
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
                  <p className="shrink-0 text-body font-medium text-anthrazit">
                    {formatiereBetrag(objekt.preis)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
